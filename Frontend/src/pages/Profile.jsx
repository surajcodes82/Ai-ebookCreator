import { useEffect, useState } from 'react';
import { Save, UserRound } from 'lucide-react';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Field';
import { LoadingState } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/api';
import { formatDate, initials } from '../lib/utils';
import * as usersService from '../services/users.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await usersService.getProfile();
        if (!active) return;
        setProfile(data.user);
        setForm({ name: data.user.name, email: data.user.email });
      } catch (error) {
        if (!active) return;
        toast.error(getErrorMessage(error));
        if (user) setForm({ name: user.name, email: user.email });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), email: form.email.trim() });
      toast.success('Profile updated successfully.');
      refreshUser().catch(() => {});
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.name || user?.name || '';
  const displayEmail = profile?.email || user?.email || '';

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Profile</h1>
        <p className="mt-1.5 text-sm text-slate-500">Manage your account information.</p>

        {loading ? (
          <div className="card mt-7">
            <LoadingState label="Loading profile..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card mt-7 space-y-6 p-6" noValidate>
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 text-xl font-bold text-white">
                {initials(displayName)}
              </span>
              <div>
                <p className="text-lg font-semibold text-slate-900">{displayName || 'Your name'}</p>
                <p className="text-sm text-slate-500">{displayEmail}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Member since {formatDate(profile?.createdAt || user?.createdAt)}
                  {typeof profile?.bookCount === 'number' && ` · ${profile.bookCount} eBook${profile.bookCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            {errors.form && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                {errors.form}
              </div>
            )}

            <Field label="Full Name" htmlFor="name" error={errors.name} required>
              <Input id="name" value={form.name} onChange={update('name')} invalid={Boolean(errors.name)} maxLength={80} />
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email} required>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                invalid={Boolean(errors.email)}
                maxLength={120}
              />
            </Field>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setForm({ name: displayName, email: displayEmail })}
                disabled={saving}
              >
                Reset
              </Button>
              <Button type="submit" loading={saving}>
                <Save size={16} /> Save Changes
              </Button>
            </div>
          </form>
        )}

        <div className="card mt-5 flex items-start gap-3 p-5">
          <UserRound size={18} className="mt-0.5 text-primary-500" />
          <p className="text-sm text-slate-500">
            Your password is hashed with bcrypt and can never be read back. Sessions are secured with
            JWT tokens that expire after 7 days.
          </p>
        </div>
      </main>
    </div>
  );
}
