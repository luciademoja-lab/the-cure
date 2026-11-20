import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SacredSymbol } from './SacredSymbol';
import type { AvatarKind } from '../../contexts/AccountContext';

/** L'immagine del profilo: la foto caricata (link firmato, privato) o uno dei tre segni. */
export function UserAvatar({
  kind,
  path,
  name,
  size = 32,
}: {
  kind: AvatarKind | null;
  path: string | null;
  name: string;
  size?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (kind !== 'image' || !path) return;
    void supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl || null);
      });
    return () => {
      alive = false;
    };
  }, [kind, path]);

  const style = { width: size, height: size };
  if (kind === 'image' && url) {
    return <img className="user-avatar user-avatar--image" src={url} alt="" style={style} />;
  }
  if (kind === 'point' || kind === 'circle' || kind === 'triangle') {
    return (
      <span className="user-avatar user-avatar--symbol" style={style}>
        <SacredSymbol kind={kind} size={Math.round(size * 0.62)} />
      </span>
    );
  }
  return (
    <span className="user-avatar user-avatar--initial" style={{ ...style, fontSize: size * 0.45 }}>
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
