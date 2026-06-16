import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { AGENT_CATEGORIES } from '../lib/frontier-services';
import type { AgentCategory, RegisterAgentParams } from '../lib/frontier-services';

const CATEGORY_OPTIONS = AGENT_CATEGORIES;

interface FormState {
  name: string;
  description: string;
  longDescription: string;
  category: AgentCategory;
  endpoint: string;
  pricePerCall: string;
  paymentAddress: string;
  tags: string;
}

const DEFAULT_FORM: FormState = {
  name: '',
  description: '',
  longDescription: '',
  category: 'ai-assistant',
  endpoint: '',
  pricePerCall: '0.05',
  paymentAddress: '',
  tags: '',
};

interface FormErrors {
  name?: string;
  description?: string;
  endpoint?: string;
  pricePerCall?: string;
  paymentAddress?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.length > 60) errors.name = 'Name must be 60 characters or fewer';

  if (!form.description.trim()) errors.description = 'Short description is required';
  else if (form.description.length > 200) errors.description = 'Description must be 200 characters or fewer';

  if (!form.endpoint.trim()) {
    errors.endpoint = 'Endpoint URL is required';
  } else {
    try {
      new URL(form.endpoint);
    } catch {
      errors.endpoint = 'Must be a valid URL (e.g. https://api.example.com/v1/chat)';
    }
  }

  const price = parseFloat(form.pricePerCall);
  if (!form.pricePerCall || isNaN(price) || price <= 0) {
    errors.pricePerCall = 'Price must be a positive number';
  } else if (price > 1000) {
    errors.pricePerCall = 'Price cannot exceed 1000 FND per call';
  }

  if (!form.paymentAddress.trim()) {
    errors.paymentAddress = 'Payment address is required';
  } else if (!/^0x[0-9a-fA-F]{40}$/.test(form.paymentAddress)) {
    errors.paymentAddress = 'Must be a valid Ethereum address (0x…)';
  }

  return errors;
}

export const RegisterAgent = () => {
  const navigate = useNavigate();
  const services = useServices();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const params: RegisterAgentParams = {
        name: form.name.trim(),
        description: form.description.trim(),
        longDescription: form.longDescription.trim() || form.description.trim(),
        category: form.category,
        endpoint: form.endpoint.trim(),
        pricePerCall: parseFloat(form.pricePerCall).toFixed(3),
        paymentAddress: form.paymentAddress.trim(),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await services.agents.registerAgent(params);
      navigate('/my-agents');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to register agent');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground">List Your Agent</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Register your x402-enabled service so Frontier members can discover and pay for it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Agent Name <span className="text-alert">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. CodeReview Pro"
            maxLength={60}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {errors.name && <p className="text-xs text-alert mt-1">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Category <span className="text-alert">*</span>
          </label>
          <select
            value={form.category}
            onChange={set('category')}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Short description */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Short Description <span className="text-alert">*</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={set('description')}
            placeholder="One-line summary shown on the card (max 200 chars)"
            maxLength={200}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {errors.description && <p className="text-xs text-alert mt-1">{errors.description}</p>}
        </div>

        {/* Long description */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Full Description
          </label>
          <textarea
            value={form.longDescription}
            onChange={set('longDescription')}
            placeholder="Detailed description shown on the agent detail page…"
            rows={4}
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Endpoint */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            x402 Endpoint URL <span className="text-alert">*</span>
          </label>
          <input
            type="url"
            value={form.endpoint}
            onChange={set('endpoint')}
            placeholder="https://api.example.com/v1/invoke"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          {errors.endpoint && <p className="text-xs text-alert mt-1">{errors.endpoint}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            The HTTP endpoint that responds with 402 and accepts X-PAYMENT header.
          </p>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Price per Call (FND) <span className="text-alert">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={form.pricePerCall}
              onChange={set('pricePerCall')}
              placeholder="0.05"
              min="0.001"
              step="0.001"
              className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              FND
            </span>
          </div>
          {errors.pricePerCall && <p className="text-xs text-alert mt-1">{errors.pricePerCall}</p>}
        </div>

        {/* Payment address */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Payment Address <span className="text-alert">*</span>
          </label>
          <input
            type="text"
            value={form.paymentAddress}
            onChange={set('paymentAddress')}
            placeholder="0x…"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
          />
          {errors.paymentAddress && <p className="text-xs text-alert mt-1">{errors.paymentAddress}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            FND payments from callers will be sent to this address.
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={set('tags')}
            placeholder="e.g. code-review, typescript, security"
            className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Server error */}
        {serverError && (
          <div className="bg-alert/10 border border-alert/20 rounded-lg p-3">
            <p className="text-xs text-alert">{serverError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted-background transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="spinner w-4 h-4 border-white/30 border-t-white" style={{ borderWidth: 2 }} />
                Listing…
              </>
            ) : (
              'List Agent'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
