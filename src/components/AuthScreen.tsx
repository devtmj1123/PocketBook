import React, { useState } from "react";
import { 
  auth, 
  db,
  handleFirestoreError,
  OperationType 
} from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc 
} from "firebase/firestore";
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ShieldAlert, 
  ArrowRight, 
  Activity, 
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: (uid: string) => void;
  setEncryptionPinAction: (pin: string) => void;
}

export default function AuthScreen({ onAuthSuccess, setEncryptionPinAction }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("1234"); // default PIN for easy start
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Terms and regulations toggles
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      setErrorMsg("Please read and accept the Terms of Service and Privacy Policy checkbox before authenticating.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        // Prepare default user profile
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
          // Initialize first-time profile in Firestore
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || "Grounded Investor",
            theme: "light",
            monthlyIncome: 5500,
            salt: "pocketbook-salt-" + Math.floor(Math.random() * 1000),
            updatedAt: new Date().toISOString()
          });
        }
        
        // Pass encryption PIN
        setEncryptionPinAction(pin);
        onAuthSuccess(user.uid);
      }
    } catch (err: any) {
      console.error("Google login failed:", err);
      setErrorMsg("Google Authentication was canceled or failed. E.g. make sure the domain is approved.");
    } finally {
      setLoading(false);
    }
  };

  // Sign in or Registation with Email/Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg("Please accept the Terms of Service and Privacy Policy checkbox prior to initiating authentication.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("Please complete all credentials!");
      return;
    }
    if (pin.length < 4) {
      setErrorMsg("Encryption security PIN must be at least 4 digits/characters!");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        // Registering user
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        // Save initial Profile
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: email.split("@")[0],
          theme: "light",
          monthlyIncome: 5500,
          salt: "pocketbook-salt-" + Math.floor(Math.random() * 1000),
          updatedAt: new Date().toISOString()
        });

        setEncryptionPinAction(pin);
        onAuthSuccess(user.uid);
      } else {
        // Signing in user
        const res = await signInWithEmailAndPassword(auth, email, password);
        const user = res.user;
        
        setEncryptionPinAction(pin);
        onAuthSuccess(user.uid);
      }
    } catch (err: any) {
      console.error("Auth process error:", err);
      // Human-readable errors
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMsg("Invalid email or security password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use by another ledger!");
      } else if (err.code === "auth/invalid-credential") {
        setErrorMsg("Incorrect credentials. Verify your account or register a new one.");
      } else {
        setErrorMsg(err.message || "An error occurred during transaction authorization.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden" id="auth-main-view">
      
      {/* BACKGROUND GRAPHIC GLOWS */}
      <div className="absolute -top-30 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-30 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/70 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-8" id="auth-card">
        
        {/* LOGO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl shadow-lg mb-3">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            PocketBook <span className="text-indigo-400 font-mono text-xs uppercase bg-indigo-950/80 px-2 py-0.5 rounded-full ml-1 font-bold">Secure</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 uppercase font-mono tracking-widest font-bold">
            Zero-Knowledge Real-Time Ledger
          </p>
        </div>

        {/* FEEDBACK BANNER */}
        {errorMsg && (
          <div className="mb-5 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl flex items-start gap-2.5" id="auth-error-block">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* AUTH TAB CONTROL */}
        <div className="grid grid-cols-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
            }}
            className={`text-xs font-semibold py-2 rounded-xl transition-all ${
              !isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
            }}
            className={`text-xs font-semibold py-2 rounded-xl transition-all ${
              isSignUp ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* CORE FORM */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none placeholder:text-slate-600 focus:bg-slate-900 text-slate-100 transition-all font-mono"
                placeholder="e.g. auditor@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl outline-none placeholder:text-slate-600 focus:bg-slate-900 text-slate-100 transition-all font-mono"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SYMMETRIC ENCRYPTION PARAMETER */}
          <div className="bg-indigo-950/20 border border-indigo-900/60 p-4 rounded-2xl my-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">Client-Side Cipher Key (PIN)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal mb-2">
              All financial entries (names, titles, block lists, notes) are encrypted client-side using a key derived from this secret PIN.
            </p>
            <input
              type="text"
              required
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center text-md font-bold text-indigo-100 bg-slate-950 border border-indigo-900 focus:border-indigo-500 py-1.5 rounded-xl outline-none font-mono"
              placeholder="Enter PIN, e.g. 1234"
            />
          </div>

          {/* TERMS AND PRIVACY CHECKBOX */}
          <div className="flex items-start gap-2.5 py-1 px-0.5 my-2">
            <input
              type="checkbox"
              id="agree-terms"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 bg-slate-900 border border-slate-800 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="agree-terms" className="text-[10px] text-slate-400 leading-normal select-none cursor-pointer">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-indigo-400 hover:underline inline p-0 outline-none font-bold bg-transparent border-0 cursor-pointer text-left"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="text-indigo-400 hover:underline inline p-0 outline-none font-bold bg-transparent border-0 cursor-pointer text-left"
              >
                Privacy Policy
              </button>{" "}
              regarding zero-knowledge asset ciphering.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1 font-mono uppercase tracking-wider shadow-md"
          >
            {loading ? "Authenticating Cloud Vault..." : isSignUp ? "Create Secure Account" : "Decipher & Verify"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* GOOGLE INSTANT DEPLOY PROVIDER */}
        <div className="mt-6 pt-5 border-t border-slate-900 space-y-3">
          <div className="relative text-center">
            <span className="bg-slate-950 text-[10px] text-slate-500 font-mono uppercase px-2 py-0.5 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              Or Pre-Authorized
            </span>
            <div className="border-t border-slate-900 w-full" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs py-2.5 rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-2 font-mono font-bold shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335" 
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.65 1.58 14.99 1 12 1 7.35 1 3.42 3.68 1.43 7.6l3.8 2.95C6.18 7.35 8.87 5.04 12 5.04z" 
              />
              <path 
                fill="#4285F4" 
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.41c-.28 1.44-1.09 2.66-2.3 3.47l3.58 2.78c2.1-1.94 3.3-4.8 3.3-8.36z" 
              />
              <path 
                fill="#FBBC05" 
                d="M5.23 15.39c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3l-3.8-2.95C.51 9.48 0 10.7 0 12s.51 2.52 1.43 4.16l3.8-2.77z" 
              />
              <path 
                fill="#34A853" 
                d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.58-2.78c-.99.66-2.26 1.05-3.8 1.05-3.13 0-5.82-2.31-6.77-5.51l-3.8 2.95C3.42 20.32 7.35 23 12 23z" 
              />
            </svg>
            Sign In with Google Identity
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center leading-normal mt-5">
          Note: Credentials are sent directly to Google Firebase and verified. Email Signup works seamlessly once activated in the Firebase console.
        </p>

      </div>

      {/* TERMS OF SERVICE MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              📜 Terms of Service Agreement
            </h3>
            <div className="text-[11px] text-slate-400 leading-relaxed max-h-60 overflow-y-auto space-y-2 pr-1 select-none text-left">
              <p>Welcome to PocketBook Secure Ledger Platform. By creating an account or using our platform, you agree to comply with and be bound by these Terms of Service.</p>
              <h4 className="font-bold text-slate-300">1. Client-Side Cryptography</h4>
              <p>We process your financial balances, transaction names, goals, and schedule markers with local hybrid AES encryption. You are solely responsible for memorizing your secure salt pin; we cannot verify or restore lost cipher pins.</p>
              <h4 className="font-bold text-slate-300">2. Real-Time Processing limits</h4>
              <p>Financial summaries and LLM indexing are processed entirely client-side or compiled temporary via proxy tokens. No direct investment actions or money transfers are executed inside this visual advisor workspace.</p>
              <h4 className="font-bold text-slate-300">3. Workspace Acceptable Use</h4>
              <p>You agree not to exploit database nodes, reverse engineer the browser layout wrappers, or utilize automated scripts to flood network endpoints.</p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-xs font-bold py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Close Regulations
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              🛡️ Zero-Knowledge Privacy Policy
            </h3>
            <div className="text-[11px] text-slate-400 leading-relaxed max-h-60 overflow-y-auto space-y-2 pr-1 select-none text-left">
              <p>We believe your personal finance and daily journals must remain absolutely private. Here is how your data is treated:</p>
              <h4 className="font-bold text-slate-300">1. Private Encryption Keys</h4>
              <p>Your Google API Keys and custom Groq keys are stored strictly inside your private browser sandbox using <code>localStorage</code>. They never touch persistent server databases.</p>
              <h4 className="font-bold text-slate-300">2. Document Zero-Knowledge</h4>
              <p>Individual ledger transactions, title headers, and scheduled event descriptions are hashed before they transit to the Firebase Cloud nodes. We have zero visibility into your financial labels or savings goal texts.</p>
              <h4 className="font-bold text-slate-300">3. Cookies and Analytics</h4>
              <p>This sandbox employs zero third-party telemetry, commercial cookies, trackers, or commercial user profiling beacons.</p>
            </div>
            <button
              onClick={() => setShowPolicyModal(false)}
              className="w-full bg-slate-800 hover:bg-slate-755 text-slate-200 font-mono text-xs font-bold py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              Close Privacy Agreement
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
