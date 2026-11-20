import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/I18nProvider';
import { apiPost } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AvatarKind, planOf, useAccount } from '../contexts/AccountContext';
import { UserAvatar } from '../components/atoms/UserAvatar';
import { SacredSymbol } from '../components/atoms/SacredSymbol';

const SYMBOLS: Exclude<AvatarKind, 'image'>[] = ['point', 'circle', 'triangle'];

/** Rimpicciolisce la foto a 320px (quadrata, ritagliata al centro) prima di caricarla. */
async function toSquareWebp(file: File, side = 320): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const crop = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(bitmap, (bitmap.width - crop) / 2, (bitmap.height - crop) / 2, crop, crop, 0, 0, side, side);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/webp', 0.86)
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { account, refresh } = useAccount();
  const [nickname, setNickname] = useState(account?.nickname || '');
  const [notes, setNotes] = useState(account?.elayraNotes || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ key: string; ok: boolean; text: string } | null>(null);

  if (!account) return null;
  const plan = planOf(account);
  const hasSubscription = Boolean(
    account.subscription && ['active', 'trialing', 'past_due'].includes(account.subscription.status)
  );

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setNotice(null);
    try {
      const text = await fn();
      setNotice({ key, ok: true, text });
      window.dispatchEvent(new Event('elayra:account-changed'));
    } catch (e) {
      setNotice({ key, ok: false, text: e instanceof Error ? e.message : t('chat.error.generic') });
    } finally {
      setBusy(null);
    }
  };

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    void run('name', async () => {
      await apiPost('/api/profile', { nickname });
      await refresh();
      return t('profile.saved');
    });
  };

  const saveNotes = (e: FormEvent) => {
    e.preventDefault();
    void run('notes', async () => {
      await apiPost('/api/profile', { elayraNotes: notes });
      await refresh();
      return t('profile.notesSaved');
    });
  };

  const chooseSymbol = (kind: Exclude<AvatarKind, 'image'>) =>
    run('avatar', async () => {
      const old = account.avatarKind === 'image' ? account.avatarPath : null;
      await apiPost('/api/profile', { avatarKind: kind });
      if (old) await supabase.storage.from('avatars').remove([old]);
      await refresh();
      return t('profile.saved');
    });

  const uploadPhoto = (file: File | undefined) => {
    if (!file || !user) return;
    void run('avatar', async () => {
      if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !file.type.startsWith('image/')) {
        throw new Error(t('profile.photoType'));
      }
      const blob = await toSquareWebp(file);
      const path = `${user.id}/avatar-${Date.now()}.webp`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/webp' });
      if (error) throw new Error(error.message);
      const old = account.avatarKind === 'image' ? account.avatarPath : null;
      await apiPost('/api/profile', { avatarKind: 'image', avatarPath: path });
      if (old && old !== path) await supabase.storage.from('avatars').remove([old]);
      await refresh();
      return t('profile.saved');
    });
  };

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    void run('password', async () => {
      if (password.length < 8) throw new Error(t('profile.passwordShort'));
      if (password !== confirm) throw new Error(t('profile.passwordMismatch'));
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setPassword('');
      setConfirm('');
      return t('profile.passwordChanged');
    });
  };

  const openPortal = () =>
    run('plan', async () => {
      const { url } = await apiPost<{ url: string }>('/api/billing/portal');
      window.location.assign(url);
      return t('plans.redirect');
    });

  const note = (key: string) =>
    notice?.key === key ? (
      <p className={notice.ok ? 'profile-ok' : 'page-error'} role={notice.ok ? 'status' : 'alert'}>
        {notice.text}
      </p>
    ) : null;

  const renewal = account.subscription?.current_period_end
    ? new Date(account.subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <main className="page-shell profile-page">
      <header className="profile-head">
        <UserAvatar kind={account.avatarKind} path={account.avatarPath} name={account.nickname} size={88} />
        <div>
          <h1>{account.nickname}</h1>
          <p className="profile-email">{user?.email}</p>
        </div>
      </header>

      <section className="card profile-card" aria-labelledby="profile-plan">
        <h2 id="profile-plan">{t('profile.plan')}</h2>
        <p>
          <strong className="profile-plan-name">{plan?.name}</strong>
          {renewal && hasSubscription && <span className="profile-muted"> · {t('profile.renews', { date: renewal })}</span>}
        </p>
        <p className="profile-muted">{t('plans.usage', { used: account.usage.used, limit: account.usage.limit })}</p>
        {account.subscription?.sponsored_by && <p className="profile-muted">{t('plans.sponsored')}</p>}
        <div className="profile-actions">
          <Link to="/plans" className="cta-button primary">
            {t('profile.changePlan')}
          </Link>
          {hasSubscription && (
            <button type="button" className="cta-button secondary" disabled={busy !== null} onClick={() => void openPortal()}>
              {t('plans.manage')}
            </button>
          )}
        </div>
        {hasSubscription && <p className="profile-muted profile-small">{t('profile.portalHint')}</p>}
        {note('plan')}
      </section>

      <section className="card profile-card" aria-labelledby="profile-avatar">
        <h2 id="profile-avatar">{t('profile.avatar')}</h2>
        <div className="profile-avatar-choices" role="group" aria-label={t('profile.avatar')}>
          {SYMBOLS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`profile-avatar-choice ${account.avatarKind === kind ? 'is-selected' : ''}`}
              aria-pressed={account.avatarKind === kind}
              disabled={busy !== null}
              onClick={() => void chooseSymbol(kind)}
            >
              <SacredSymbol kind={kind} size={34} />
              <span>{t(`profile.symbol.${kind}`)}</span>
            </button>
          ))}
          <label className={`profile-avatar-choice profile-upload ${account.avatarKind === 'image' ? 'is-selected' : ''}`}>
            <input
              type="file"
              accept="image/*"
              disabled={busy !== null}
              onChange={(e) => {
                uploadPhoto(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <span className="profile-upload-plus" aria-hidden="true">
              +
            </span>
            <span>{busy === 'avatar' ? t('profile.uploading') : t('profile.photo')}</span>
          </label>
        </div>
        {note('avatar')}
      </section>

      <section className="card profile-card" aria-labelledby="profile-notes">
        <h2 id="profile-notes">{t('profile.notes')}</h2>
        <p className="profile-muted">{t('profile.notesLead')}</p>
        <form onSubmit={saveNotes} className="profile-form profile-form--stack profile-notes-form">
          <textarea
            className="journal-textarea"
            rows={9}
            maxLength={6000}
            value={notes}
            placeholder={t('profile.notesPlaceholder')}
            onChange={(e) => setNotes(e.target.value)}
            aria-label={t('profile.notes')}
          />
          <div className="profile-notes-row">
            <span className="profile-muted profile-small">{notes.length} / 6000</span>
            <button type="submit" className="cta-button secondary" disabled={busy !== null}>
              {t('profile.save')}
            </button>
          </div>
        </form>
        <p className="profile-muted profile-small">{t('profile.notesPrivacy')}</p>
        {note('notes')}
      </section>

      <section className="card profile-card" aria-labelledby="profile-name">
        <h2 id="profile-name">{t('profile.name')}</h2>
        <form onSubmit={saveName} className="profile-form">
          <input
            type="text"
            value={nickname}
            minLength={2}
            maxLength={40}
            onChange={(e) => setNickname(e.target.value)}
            aria-label={t('profile.name')}
          />
          <button type="submit" className="cta-button secondary" disabled={busy !== null || nickname.trim().length < 2}>
            {t('profile.save')}
          </button>
        </form>
        {note('name')}
      </section>

      <section className="card profile-card" aria-labelledby="profile-password">
        <h2 id="profile-password">{t('profile.password')}</h2>
        <form onSubmit={changePassword} className="profile-form profile-form--stack">
          <input
            type="password"
            autoComplete="new-password"
            placeholder={t('profile.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label={t('profile.newPassword')}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={t('profile.confirmPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-label={t('profile.confirmPassword')}
          />
          <button type="submit" className="cta-button secondary" disabled={busy !== null || !password}>
            {t('profile.changePassword')}
          </button>
        </form>
        <p className="profile-muted profile-small">{t('profile.passwordHint')}</p>
        {note('password')}
      </section>
    </main>
  );
}
