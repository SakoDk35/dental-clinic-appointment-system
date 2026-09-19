// src/pages/admin/ManageServicesPage.tsx
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { FormField } from "../../components/common/FormField";
import { useAuth } from "../../hooks/useAuth";
import { listServices, createService, updateService, activateService, deactivateService } from "../../api/servicesApi";
import type { Service } from "../../types";
import { VALIDATION_LIMITS } from "../../utils/validationLimits";

export function ManageServicesPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | "new" | null>(null);

  function load() {
    if (!token) return;
    setIsLoading(true);
    listServices(token)
      .then(setServices)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load services."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [token]);

  return (
    <AppShell pageTitle="Services">
      <div className="d-flex justify-content-end mb-3">
        <button type="button" className="btn btn-primary" onClick={() => setEditingService("new")}>
          + Add Service
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <p className="text-helper p-3 mb-0">Loading...</p>
        ) : services.length === 0 ? (
          <p className="text-helper p-3 mb-0">No services yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Price (AMD)</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.durationMinutes} min</td>
                    <td>{s.price.toLocaleString()}</td>
                    <td>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          checked={s.isActive}
                          aria-label={`${s.name} active`}
                          onChange={async () => {
                            if (!token) return;
                            s.isActive ? await deactivateService(token, s.id) : await activateService(token, s.id);
                            load();
                          }}
                        />
                      </div>
                    </td>
                    <td className="text-end">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditingService(s)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingService && (
        <ServiceModal
          service={editingService === "new" ? null : editingService}
          onClose={() => setEditingService(null)}
          onSaved={() => {
            setEditingService(null);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function ServiceModal({
  service,
  onClose,
  onSaved,
}: {
  service: Service | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState(service?.name ?? "");
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(service?.durationMinutes ?? 30);
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const priceNumber = Number(price);
    if (!name.trim() || !priceNumber || priceNumber <= 0) {
      setError("Name and a positive price are required.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      if (service) {
        await updateService(token, service.id, { name, durationMinutes, price: priceNumber });
      } else {
        await createService(token, { name, durationMinutes, price: priceNumber });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(15,23,42,0.4)" }} onClick={onClose}>
      <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="h5 mb-0">{service ? "Edit Service" : "Add Service"}</h2>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <FormField id="serviceName" label="Service Name" value={name} maxLength={VALIDATION_LIMITS.serviceName} onChange={(e) => setName(e.target.value)} />
              <div className="mb-3">
                <label htmlFor="serviceDuration" className="form-label fw-medium">
                  Duration
                </label>
                <select
                  id="serviceDuration"
                  className="form-select"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) as 30 | 60)}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <FormField
                id="servicePrice"
                label="Price (AMD)"
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
