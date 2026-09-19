// src/pages/shared/BillingPage.tsx
import { useEffect, useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { StatusBadge } from "../../components/common/StatusBadge";
import { StatCard } from "../../components/common/StatCard";
import { useAuth } from "../../hooks/useAuth";
import { listPayments, markPaymentPaid, getBillingSummary, type BillingSummary } from "../../api/paymentsApi";
import type { Payment } from "../../types";

export function BillingPage() {
  const { token, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | "UNPAID" | "PAID">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listPayments(token, { status: statusFilter || undefined })
      .then(setPayments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load payments."))
      .finally(() => setIsLoading(false));

    // Revenue totals are Admin-only, both on the backend and here.
    if (user?.role === "ADMIN") {
      getBillingSummary(token).then(setSummary).catch(() => setSummary(null));
    }
  }

  useEffect(load, [token, statusFilter]);

  async function handleMarkPaid(id: number) {
    if (!token) return;
    setError(null);
    try {
      await markPaymentPaid(token, id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payment.");
    } finally {
      setConfirmingId(null);
    }
  }

  const confirmingPayment = payments.find((p) => p.id === confirmingId) ?? null;

  return (
    <AppShell pageTitle="Billing">
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <StatCard label="Total Revenue" value={`${summary.totalRevenue.toLocaleString()} AMD`} icon="R" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard label="Unpaid Total" value={`${summary.unpaidTotal.toLocaleString()} AMD`} icon="U" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard label="Paid" value={String(summary.paidCount)} icon="✓" />
          </div>
          <div className="col-6 col-md-3">
            <StatCard label="Unpaid" value={String(summary.unpaidCount)} icon="!" />
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "UNPAID" | "PAID")}
          aria-label="Filter by payment status"
        >
          <option value="">All</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-helper p-3 mb-0">No payment records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.patientName}</td>
                    <td>{p.serviceName}</td>
                    <td>{p.date}</td>
                    <td className="text-end">{p.amount.toLocaleString()} AMD</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-end">
                      {p.status === "UNPAID" && (
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setConfirmingId(p.id)}>
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmingPayment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(15,23,42,0.4)" }}
          onClick={() => setConfirmingId(null)}
        >
          <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="h5 mb-0">Confirm Payment</h2>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setConfirmingId(null)} />
              </div>
              <div className="modal-body">
                Confirm payment of {confirmingPayment.amount.toLocaleString()} AMD from {confirmingPayment.patientName}?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirmingId(null)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleMarkPaid(confirmingPayment.id)}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
