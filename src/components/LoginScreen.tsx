import React, { useState } from 'react';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../utils/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  AlertCircle, 
  Sparkles,
  Loader2
} from 'lucide-react';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Check if user has an existing firestore profile. If not, create it with placeholders
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'Novo Cliente',
          email: user.email || '',
          phone: '',
          address: 'Por favor, atualize seu endereço',
          role: 'cliente',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha ao autenticar com a Conta Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 antialiased text-white font-sans relative overflow-hidden">
      {/* Decorative background blur blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-85 bg-emerald-50/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 relative z-10 animate-scale-up">
        
        {/* Brand identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-2 shadow border border-emerald-900 select-none">
            <img
              src="https://ugc.production.linktr.ee/d7ee3797-a896-427c-8af9-dda870971839_MARCA-KAYACV-03.png"
              alt="Kayagreen Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-1.5 font-sans">
              Kayagreen <Sparkles className="w-4 h-4 text-emerald-400" />
            </h2>
            <p className="text-xs text-emerald-500 font-mono uppercase tracking-wider mt-0.5">
              Sistema de Pedidos de Microverdes
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1 text-center">
          <h3 className="text-lg font-bold text-slate-100">
            Acesse o sistema
          </h3>
          <p className="text-xs text-slate-400">
            Entre de forma segura utilizando sua Conta Google
          </p>
        </div>

        {/* Error panel */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-900 p-3 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Google sign in button */}
        <div className="py-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 rounded-xl h-12 font-black transition duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-lg active:scale-98 text-sm uppercase tracking-wider disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Entrar com o Google
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 font-mono">
          Ambiente seguro de autenticação Kayagreen
        </p>

      </div>
    </div>
  );
}
