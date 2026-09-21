const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const request = require("supertest");

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required. Tests will never use DATABASE_URL implicitly.");
}

const testUrl = new URL(testDatabaseUrl);
const developmentUrl = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
if (!testUrl.pathname.toLowerCase().includes("test")) {
  throw new Error("TEST_DATABASE_URL database name must contain 'test'.");
}
if (developmentUrl && testUrl.href === developmentUrl.href) {
  throw new Error("TEST_DATABASE_URL must not point to the development database.");
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_SECRET = "integration-test-secret-that-is-longer-than-32-characters";
process.env.FRONTEND_URL = "http://localhost:5173";

const { PrismaClient } = require("@prisma/client");
const { app } = require("../dist/app");
const { deactivateUserSafely } = require("../dist/modules/users/users.service");
const { getClinicDateTimeParts } = require("../dist/utils/clinicTime");

const prisma = new PrismaClient();
const api = request(app);
const password = "Password123";
const futureDate = "2099-01-05";

let admin;
let receptionist;
let dentistUser;
let dentist;
let patient;
let patientTwo;
let service30;
let service60;
let tokens;
let cancelledAppointmentId;
let completedAppointmentId;

async function clearTestDatabase() {
  await prisma.notification.deleteMany();
  await prisma.treatmentNote.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.dentistTimeOff.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
}

async function login(email) {
  const response = await api.post("/api/v1/auth/login").send({ email, password });
  assert.equal(response.status, 200, response.text);
  return response.body.data.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  await clearTestDatabase();
  const passwordHash = await bcrypt.hash(password, 4);

  admin = await prisma.user.create({
    data: { fullName: "Test Admin", email: "admin@test.local", passwordHash, role: "ADMIN" },
  });
  receptionist = await prisma.user.create({
    data: { fullName: "Test Receptionist", email: "reception@test.local", passwordHash, role: "RECEPTIONIST" },
  });
  dentistUser = await prisma.user.create({
    data: { fullName: "Test Dentist", email: "dentist@test.local", passwordHash, role: "DENTIST" },
  });
  patient = await prisma.user.create({
    data: { fullName: "Test Patient", email: "patient@test.local", passwordHash, role: "PATIENT" },
  });
  patientTwo = await prisma.user.create({
    data: { fullName: "Test Patient Two", email: "patient2@test.local", passwordHash, role: "PATIENT" },
  });
  dentist = await prisma.dentist.create({
    data: {
      userId: dentistUser.id,
      specialty: "General Dentistry",
      workingHours: {
        create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
        })),
      },
    },
  });
  service30 = await prisma.service.create({
    data: { name: "Test 30 Minute Service", durationMinutes: 30, price: 100 },
  });
  service60 = await prisma.service.create({
    data: { name: "Test 60 Minute Service", durationMinutes: 60, price: 200 },
  });

  tokens = {
    admin: await login(admin.email),
    receptionist: await login(receptionist.email),
    dentist: await login(dentistUser.email),
    patient: await login(patient.email),
    patientTwo: await login(patientTwo.email),
  };
});

after(async () => {
  await clearTestDatabase();
  await prisma.$disconnect();
});

test("authentication uses active database user state and current role", async () => {
  await prisma.user.update({ where: { id: patient.id }, data: { isActive: false } });
  const inactive = await api.get("/api/v1/users/me").set(auth(tokens.patient));
  assert.equal(inactive.status, 401);

  await prisma.user.update({
    where: { id: patient.id },
    data: { isActive: true, role: "RECEPTIONIST" },
  });
  const currentRole = await api.get("/api/v1/patients").set(auth(tokens.patient));
  assert.equal(currentRole.status, 200, currentRole.text);
  await prisma.user.update({ where: { id: patient.id }, data: { role: "PATIENT" } });
});

test("RBAC rejects Patient access to Admin dashboard", async () => {
  const response = await api.get("/api/v1/dashboard/admin").set(auth(tokens.patient));
  assert.equal(response.status, 403);
});

test("Admin cannot deactivate self or the last active Admin", async () => {
  const self = await api.patch(`/api/v1/users/${admin.id}/deactivate`).set(auth(tokens.admin));
  assert.equal(self.status, 409);
  assert.match(self.body.message, /own account/i);

  await assert.rejects(
    () => deactivateUserSafely(admin.id, receptionist.id),
    /At least one active Admin account must remain/
  );
});

test("booking validation rejects past and outside-hours requests", async () => {
  const past = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: "2020-01-06",
    startTime: "09:00",
  });
  assert.equal(past.status, 400);

  const outsideHours = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "08:30",
  });
  assert.equal(outsideHours.status, 400);

  const extendsPastClosing = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service60.id,
    appointmentDate: futureDate,
    startTime: "16:30",
  });
  assert.equal(extendsPastClosing.status, 400);
});

test("dentist time-off blocks availability, booking, and rescheduling safely", async () => {
  const fullDayDate = "2099-01-06";
  const partialDate = "2099-01-07";
  const rescheduleDate = "2099-01-09";

  const patientCannotManage = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.patient))
    .send({ date: fullDayDate, fullDay: true });
  assert.equal(patientCannotManage.status, 403);

  const fullDay = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.admin))
    .send({ date: fullDayDate, fullDay: true });
  assert.equal(fullDay.status, 201, fullDay.text);

  const fullDaySlots = await api
    .get(`/api/v1/appointments/available-slots?dentistId=${dentist.id}&date=${fullDayDate}&serviceId=${service30.id}`)
    .set(auth(tokens.patient));
  assert.equal(fullDaySlots.status, 200, fullDaySlots.text);
  assert.deepEqual(fullDaySlots.body.data, []);

  const partial = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.admin))
    .send({ date: partialDate, fullDay: false, startTime: "10:00", endTime: "12:00" });
  assert.equal(partial.status, 201, partial.text);

  const partialSlots = await api
    .get(`/api/v1/appointments/available-slots?dentistId=${dentist.id}&date=${partialDate}&serviceId=${service30.id}`)
    .set(auth(tokens.patient));
  assert.equal(partialSlots.status, 200, partialSlots.text);
  assert.ok(partialSlots.body.data.includes("09:00"));
  assert.ok(partialSlots.body.data.includes("12:00"));
  assert.ok(!partialSlots.body.data.includes("10:00"));
  assert.ok(!partialSlots.body.data.includes("11:30"));

  const blockedBooking = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: partialDate,
    startTime: "10:30",
  });
  assert.equal(blockedBooking.status, 409);

  const existing = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: rescheduleDate,
    startTime: "09:00",
  });
  assert.equal(existing.status, 201, existing.text);
  const blockedForReschedule = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.admin))
    .send({ date: rescheduleDate, fullDay: false, startTime: "10:00", endTime: "11:00" });
  assert.equal(blockedForReschedule.status, 201, blockedForReschedule.text);

  const rejectedReschedule = await api
    .patch(`/api/v1/appointments/${existing.body.data.id}/reschedule`)
    .set(auth(tokens.receptionist))
    .send({ appointmentDate: rescheduleDate, startTime: "10:00" });
  assert.equal(rejectedReschedule.status, 409);

  const conflictDate = "2099-01-08";
  const existingForConflict = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: conflictDate,
    startTime: "14:00",
  });
  assert.equal(existingForConflict.status, 201, existingForConflict.text);
  const conflictingTimeOff = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.admin))
    .send({ date: conflictDate, fullDay: false, startTime: "13:30", endTime: "15:00" });
  assert.equal(conflictingTimeOff.status, 409);
  assert.match(conflictingTimeOff.body.message, /active appointment/i);

  const secondDentistUser = await prisma.user.create({
    data: {
      fullName: "Unaffected Dentist",
      email: "unaffected-dentist@test.local",
      passwordHash: dentistUser.passwordHash,
      role: "DENTIST",
    },
  });
  const secondDentist = await prisma.dentist.create({
    data: {
      userId: secondDentistUser.id,
      workingHours: {
        create: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "17:00" })),
      },
    },
  });
  const unaffectedBooking = await api.post("/api/v1/appointments").set(auth(tokens.patientTwo)).send({
    dentistId: secondDentist.id,
    serviceId: service30.id,
    appointmentDate: partialDate,
    startTime: "10:30",
  });
  assert.equal(unaffectedBooking.status, 201, unaffectedBooking.text);
});

test("patients can safely reschedule only their own eligible future appointments", async () => {
  const originalDate = "2099-02-02";
  const newDate = "2099-02-03";
  const blockedDate = "2099-02-04";

  const booked = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: originalDate,
    startTime: "09:00",
  });
  assert.equal(booked.status, 201, booked.text);
  const appointmentId = booked.body.data.id;
  const originalPayment = await prisma.payment.findUnique({ where: { appointmentId } });

  const anotherPatient = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patientTwo))
    .send({ appointmentDate: newDate, startTime: "09:00" });
  assert.equal(anotherPatient.status, 403);

  const dentistChange = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patient))
    .send({ dentistId: dentist.id + 999, appointmentDate: newDate, startTime: "09:00" });
  assert.equal(dentistChange.status, 403);

  const rescheduled = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: newDate, startTime: "10:00" });
  assert.equal(rescheduled.status, 200, rescheduled.text);
  assert.equal(rescheduled.body.data.appointmentDate, newDate);
  assert.equal(rescheduled.body.data.startTime, "10:00");
  assert.equal(rescheduled.body.data.dentist.id, dentist.id);
  assert.equal(rescheduled.body.data.service.id, service30.id);

  const payments = await prisma.payment.findMany({ where: { appointmentId } });
  assert.equal(payments.length, 1);
  assert.equal(payments[0].id, originalPayment.id);
  assert.equal(payments[0].status, originalPayment.status);

  const patientNotification = await prisma.notification.findFirst({
    where: { userId: patient.id, relatedAppointmentId: appointmentId, type: "APPOINTMENT_RESCHEDULED" },
  });
  const staffNotification = await prisma.notification.findFirst({
    where: { userId: receptionist.id, relatedAppointmentId: appointmentId, type: "PATIENT_SELF_RESCHEDULED" },
  });
  assert.ok(patientNotification);
  assert.ok(staffNotification);

  const past = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: "2020-01-01", startTime: "10:00" });
  assert.equal(past.status, 400);

  const timeOff = await api
    .post(`/api/v1/dentists/${dentist.id}/time-off`)
    .set(auth(tokens.admin))
    .send({ date: blockedDate, fullDay: false, startTime: "11:00", endTime: "12:00" });
  assert.equal(timeOff.status, 201, timeOff.text);
  const blockedByTimeOff = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: blockedDate, startTime: "11:00" });
  assert.equal(blockedByTimeOff.status, 409);

  const occupied = await api.post("/api/v1/appointments").set(auth(tokens.patientTwo)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: blockedDate,
    startTime: "13:00",
  });
  assert.equal(occupied.status, 201, occupied.text);
  const overlapping = await api
    .patch(`/api/v1/appointments/${appointmentId}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: blockedDate, startTime: "13:00" });
  assert.equal(overlapping.status, 409);

  const cancelled = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: "2099-02-05",
    startTime: "09:00",
  });
  assert.equal(cancelled.status, 201, cancelled.text);
  await api.patch(`/api/v1/appointments/${cancelled.body.data.id}/cancel`).set(auth(tokens.patient));
  const cancelledReschedule = await api
    .patch(`/api/v1/appointments/${cancelled.body.data.id}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: "2099-02-06", startTime: "09:00" });
  assert.equal(cancelledReschedule.status, 409);

  const completed = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      dentistId: dentist.id,
      serviceId: service30.id,
      createdById: patient.id,
      appointmentDate: new Date(Date.UTC(2099, 1, 5)),
      startTime: "10:00",
      endTime: "10:30",
      status: "COMPLETED",
      payment: { create: { amount: 100, status: "UNPAID" } },
    },
  });
  const completedReschedule = await api
    .patch(`/api/v1/appointments/${completed.id}/reschedule`)
    .set(auth(tokens.patient))
    .send({ appointmentDate: "2099-02-06", startTime: "10:00" });
  assert.equal(completedReschedule.status, 409);
});

test("staff appointment filters combine date, dentist, status, and patient search without weakening RBAC", async () => {
  const filterDate = "2099-03-01";
  const otherDate = "2099-03-02";
  const filterPatient = await prisma.user.create({
    data: {
      fullName: "Filter Alpha Patient",
      email: "filter-alpha@test.local",
      phone: "+37400123456",
      passwordHash: dentistUser.passwordHash,
      role: "PATIENT",
    },
  });
  const filterDentistUser = await prisma.user.create({
    data: {
      fullName: "Filter Dentist",
      email: "filter-dentist@test.local",
      passwordHash: dentistUser.passwordHash,
      role: "DENTIST",
    },
  });
  const filterDentist = await prisma.dentist.create({
    data: {
      userId: filterDentistUser.id,
      workingHours: {
        create: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, startTime: "09:00", endTime: "17:00" })),
      },
    },
  });

  const bookedAlpha = await api.post("/api/v1/appointments").set(auth(tokens.receptionist)).send({
    patientId: filterPatient.id,
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: filterDate,
    startTime: "09:00",
  });
  assert.equal(bookedAlpha.status, 201, bookedAlpha.text);

  const confirmedBeta = await api.post("/api/v1/appointments").set(auth(tokens.receptionist)).send({
    patientId: patientTwo.id,
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: filterDate,
    startTime: "10:00",
  });
  assert.equal(confirmedBeta.status, 201, confirmedBeta.text);
  const confirmed = await api
    .patch(`/api/v1/appointments/${confirmedBeta.body.data.id}/confirm`)
    .set(auth(tokens.receptionist));
  assert.equal(confirmed.status, 200, confirmed.text);

  const otherDentistAppointment = await api.post("/api/v1/appointments").set(auth(tokens.receptionist)).send({
    patientId: filterPatient.id,
    dentistId: filterDentist.id,
    serviceId: service30.id,
    appointmentDate: otherDate,
    startTime: "11:00",
  });
  assert.equal(otherDentistAppointment.status, 201, otherDentistAppointment.text);

  const statusFiltered = await api
    .get(`/api/v1/appointments?date=${filterDate}&status=CONFIRMED`)
    .set(auth(tokens.receptionist));
  assert.equal(statusFiltered.status, 200, statusFiltered.text);
  assert.deepEqual(statusFiltered.body.data.map((item) => item.id), [confirmedBeta.body.data.id]);

  const searchedByName = await api
    .get(`/api/v1/appointments?date=${filterDate}&search=${encodeURIComponent("Filter Alpha")}`)
    .set(auth(tokens.admin));
  assert.equal(searchedByName.status, 200, searchedByName.text);
  assert.deepEqual(searchedByName.body.data.map((item) => item.id), [bookedAlpha.body.data.id]);

  const searchedByPhone = await api
    .get(`/api/v1/appointments?date=${filterDate}&search=${encodeURIComponent("00123456")}`)
    .set(auth(tokens.receptionist));
  assert.equal(searchedByPhone.status, 200, searchedByPhone.text);
  assert.deepEqual(searchedByPhone.body.data.map((item) => item.id), [bookedAlpha.body.data.id]);

  const dateFiltered = await api
    .get(`/api/v1/appointments?date=${filterDate}`)
    .set(auth(tokens.receptionist));
  assert.equal(dateFiltered.status, 200, dateFiltered.text);
  assert.ok(dateFiltered.body.data.some((item) => item.id === bookedAlpha.body.data.id));
  assert.ok(dateFiltered.body.data.some((item) => item.id === confirmedBeta.body.data.id));
  assert.ok(!dateFiltered.body.data.some((item) => item.id === otherDentistAppointment.body.data.id));

  const dentistFiltered = await api
    .get(`/api/v1/appointments?date=${otherDate}&dentistId=${filterDentist.id}`)
    .set(auth(tokens.admin));
  assert.equal(dentistFiltered.status, 200, dentistFiltered.text);
  assert.deepEqual(dentistFiltered.body.data.map((item) => item.id), [otherDentistAppointment.body.data.id]);

  const combined = await api
    .get(`/api/v1/appointments?date=${filterDate}&dentistId=${dentist.id}&status=BOOKED&search=${encodeURIComponent("filter-alpha@test.local")}`)
    .set(auth(tokens.receptionist));
  assert.equal(combined.status, 200, combined.text);
  assert.deepEqual(combined.body.data.map((item) => item.id), [bookedAlpha.body.data.id]);

  const invalidStatus = await api
    .get(`/api/v1/appointments?status=NO_SHOW`)
    .set(auth(tokens.receptionist));
  assert.equal(invalidStatus.status, 400);

  const patientScoped = await api
    .get(`/api/v1/appointments?search=${encodeURIComponent("Filter Alpha")}`)
    .set(auth(tokens.patient));
  assert.equal(patientScoped.status, 200, patientScoped.text);
  assert.deepEqual(patientScoped.body.data, []);
});

test("30/60-minute overlap detection and concurrent booking are enforced", async () => {
  const first = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service60.id,
    appointmentDate: futureDate,
    startTime: "10:00",
  });
  assert.equal(first.status, 201, first.text);

  const overlap = await api.post("/api/v1/appointments").set(auth(tokens.patientTwo)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "10:30",
  });
  assert.equal(overlap.status, 409);

  const payload = {
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "12:00",
  };
  const simultaneous = await Promise.all([
    api.post("/api/v1/appointments").set(auth(tokens.patient)).send(payload),
    api.post("/api/v1/appointments").set(auth(tokens.patientTwo)).send(payload),
  ]);
  assert.deepEqual(simultaneous.map((response) => response.status).sort(), [201, 409]);
});

test("cancellation voids payment and the same slot can be rebooked", async () => {
  const booked = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "13:30",
  });
  assert.equal(booked.status, 201, booked.text);
  cancelledAppointmentId = booked.body.data.id;

  const unpaid = await prisma.payment.findUnique({ where: { appointmentId: cancelledAppointmentId } });
  assert.equal(unpaid.status, "UNPAID");

  const cancelled = await api
    .patch(`/api/v1/appointments/${cancelledAppointmentId}/cancel`)
    .set(auth(tokens.patient));
  assert.equal(cancelled.status, 200, cancelled.text);

  const voidPayment = await prisma.payment.findUnique({ where: { appointmentId: cancelledAppointmentId } });
  assert.equal(voidPayment.status, "VOID");

  const cannotPay = await api
    .patch(`/api/v1/payments/${voidPayment.id}/mark-paid`)
    .set(auth(tokens.receptionist));
  assert.equal(cannotPay.status, 409);

  const rebooked = await api.post("/api/v1/appointments").set(auth(tokens.patientTwo)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "13:30",
  });
  assert.equal(rebooked.status, 201, rebooked.text);
});

test("future appointments cannot be completed", async () => {
  const booked = await api.post("/api/v1/appointments").set(auth(tokens.patient)).send({
    dentistId: dentist.id,
    serviceId: service30.id,
    appointmentDate: futureDate,
    startTime: "15:00",
  });
  assert.equal(booked.status, 201, booked.text);

  const response = await api
    .patch(`/api/v1/appointments/${booked.body.data.id}/complete`)
    .set(auth(tokens.dentist));
  assert.equal(response.status, 409);
  assert.match(response.body.message, /future appointment/i);
});

test("normal BOOKED to CONFIRMED to COMPLETED lifecycle remains valid", async () => {
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patientTwo.id,
      dentistId: dentist.id,
      serviceId: service30.id,
      createdById: receptionist.id,
      appointmentDate: new Date(Date.UTC(2020, 0, 8)),
      startTime: "09:00",
      endTime: "09:30",
      payment: { create: { amount: 100, status: "UNPAID" } },
    },
  });

  const confirmed = await api
    .patch(`/api/v1/appointments/${appointment.id}/confirm`)
    .set(auth(tokens.receptionist));
  assert.equal(confirmed.status, 200, confirmed.text);
  assert.equal(confirmed.body.data.status, "CONFIRMED");

  const completed = await api
    .patch(`/api/v1/appointments/${appointment.id}/complete`)
    .set(auth(tokens.dentist));
  assert.equal(completed.status, 200, completed.text);
  assert.equal(completed.body.data.status, "COMPLETED");
});

test("completed appointment supports private treatment notes and payment", async () => {
  const pastAppointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      dentistId: dentist.id,
      serviceId: service30.id,
      createdById: receptionist.id,
      appointmentDate: new Date(Date.UTC(2020, 0, 7)),
      startTime: "11:00",
      endTime: "11:30",
      payment: { create: { amount: 100, status: "UNPAID" } },
    },
  });
  completedAppointmentId = pastAppointment.id;

  const completed = await api
    .patch(`/api/v1/appointments/${pastAppointment.id}/complete`)
    .set(auth(tokens.dentist));
  assert.equal(completed.status, 200, completed.text);

  const note = await api
    .post(`/api/v1/appointments/${pastAppointment.id}/notes`)
    .set(auth(tokens.dentist))
    .send({ noteText: "Integration test note" });
  assert.equal(note.status, 201, note.text);

  const dentistRead = await api
    .get(`/api/v1/appointments/${pastAppointment.id}/notes`)
    .set(auth(tokens.dentist));
  assert.equal(dentistRead.status, 200);
  const adminRead = await api
    .get(`/api/v1/appointments/${pastAppointment.id}/notes`)
    .set(auth(tokens.admin));
  assert.equal(adminRead.status, 200);
  const patientRead = await api
    .get(`/api/v1/appointments/${pastAppointment.id}/notes`)
    .set(auth(tokens.patient));
  assert.equal(patientRead.status, 403);
  const receptionRead = await api
    .get(`/api/v1/appointments/${pastAppointment.id}/notes`)
    .set(auth(tokens.receptionist));
  assert.equal(receptionRead.status, 403);

  const payment = await prisma.payment.findUnique({ where: { appointmentId: pastAppointment.id } });
  const paid = await api
    .patch(`/api/v1/payments/${payment.id}/mark-paid`)
    .set(auth(tokens.receptionist));
  assert.equal(paid.status, 200, paid.text);
  assert.equal(paid.body.data.status, "PAID");
});

test("cancelled appointments reject treatment notes", async () => {
  const response = await api
    .post(`/api/v1/appointments/${cancelledAppointmentId}/notes`)
    .set(auth(tokens.dentist))
    .send({ noteText: "Must not be saved" });
  assert.equal(response.status, 409);
});

test("billing summary counts PAID and UNPAID while excluding VOID", async () => {
  const summaryResponse = await api.get("/api/v1/payments/summary").set(auth(tokens.admin));
  assert.equal(summaryResponse.status, 200, summaryResponse.text);

  const expectedPaid = await prisma.payment.aggregate({
    where: { status: "PAID" },
    _sum: { amount: true },
    _count: true,
  });
  const expectedUnpaid = await prisma.payment.aggregate({
    where: { status: "UNPAID" },
    _sum: { amount: true },
    _count: true,
  });
  assert.equal(summaryResponse.body.data.totalRevenue, Number(expectedPaid._sum.amount ?? 0));
  assert.equal(summaryResponse.body.data.unpaidTotal, Number(expectedUnpaid._sum.amount ?? 0));
  assert.equal(summaryResponse.body.data.paidCount, expectedPaid._count);
  assert.equal(summaryResponse.body.data.unpaidCount, expectedUnpaid._count);
});

test("a legacy paid active appointment cannot be cancelled", async () => {
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      dentistId: dentist.id,
      serviceId: service30.id,
      createdById: receptionist.id,
      appointmentDate: new Date(Date.UTC(2099, 0, 5)),
      startTime: "16:00",
      endTime: "16:30",
      payment: { create: { amount: 100, status: "PAID", paidAt: new Date() } },
    },
  });

  const response = await api
    .patch(`/api/v1/appointments/${appointment.id}/cancel`)
    .set(auth(tokens.receptionist));
  assert.equal(response.status, 409);
  assert.match(response.body.message, /refunds are not supported/i);
});

test("payment date filters reject impossible dates", async () => {
  const response = await api
    .get("/api/v1/payments?from=2027-02-30")
    .set(auth(tokens.admin));
  assert.equal(response.status, 400);
});

test("clinic timezone helper uses Asia/Yerevan calendar date", () => {
  const parts = getClinicDateTimeParts(new Date("2026-09-20T21:30:00.000Z"));
  assert.equal(parts.date, "2026-09-21");
  assert.equal(parts.time, "01:30");
});

test("unknown API routes return the standard JSON error", async () => {
  const response = await api.get("/api/v1/does-not-exist");
  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { success: false, message: "API route not found" });
});

test("CORS rejects browser origins outside the configured frontend list", async () => {
  const allowed = await api.get("/health").set("Origin", "http://localhost:5173");
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:5173");

  const rejected = await api.get("/health").set("Origin", "https://untrusted.example");
  assert.equal(rejected.status, 403);
  assert.equal(rejected.body.message, "This origin is not allowed.");
});

test("repeated failed logins receive a clear rate-limit response", async () => {
  let response;
  for (let attempt = 0; attempt < 21; attempt += 1) {
    response = await api.post("/api/v1/auth/login").send({
      email: "missing-user@test.local",
      password: "incorrect-password",
    });
  }
  assert.equal(response.status, 429);
  assert.match(response.body.message, /too many attempts/i);
});
