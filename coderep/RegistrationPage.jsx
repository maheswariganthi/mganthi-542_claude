import { useState } from "react";

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Syne:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #faf7f2;
    --surface:   #ffffff;
    --ink:       #1a1208;
    --muted:     #8a7f72;
    --border:    #e5ddd3;
    --accent:    #c05c2a;
    --accent-lt: rgba(192,92,42,0.10);
    --success:   #2a7a4b;
    --error:     #b53030;
    --radius:    8px;
    --shadow:    0 4px 32px rgba(26,18,8,0.08);
  }

  .rp-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    padding: 24px;
    position: relative;
  }

  .rp-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(192,92,42,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(192,92,42,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .rp-card {
    position: relative;
    width: 100%; max-width: 480px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 52px 48px;
    box-shadow: var(--shadow);
    animation: rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(28px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }

  .rp-card::before {
    content: '';
    position: absolute; top: 0; left: 48px; right: 48px; height: 3px;
    background: var(--accent);
    border-radius: 0 0 3px 3px;
  }

  .rp-eyebrow {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
  }

  .rp-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px; font-weight: 700;
    color: var(--ink); line-height: 1.1;
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .rp-sub {
    font-size: 14px; font-weight: 300;
    color: var(--muted);
    margin-bottom: 36px;
  }

  .rp-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .rp-field { margin-bottom: 20px; }

  .rp-label {
    display: block;
    font-size: 11.5px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 7px;
  }

  .rp-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: #fdfbf8;
    font-family: 'Syne', sans-serif;
    font-size: 15px; color: var(--ink);
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .rp-input::placeholder { color: #c9bfb4; }
  .rp-input:focus {
    border-color: var(--accent);
    background: #fff;
    box-shadow: 0 0 0 3px var(--accent-lt);
  }
  .rp-input.err { border-color: var(--error); }

  .rp-pw-wrap { position: relative; }
  .rp-eye {
    position: absolute; right: 11px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--muted); padding: 4px; display: flex; align-items: center;
    transition: color 0.15s;
  }
  .rp-eye:hover { color: var(--ink); }

  .rp-strength { margin-top: 7px; display: flex; gap: 4px; }
  .rp-seg {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--border);
    transition: background 0.3s;
  }
  .rp-seg.active-1 { background: var(--error); }
  .rp-seg.active-2 { background: #d98c2a; }
  .rp-seg.active-3 { background: #5ba05b; }
  .rp-seg.active-4 { background: var(--success); }

  .rp-err-msg {
    font-size: 12px; color: var(--error);
    margin-top: 5px; display: flex; align-items: center; gap: 4px;
  }

  .rp-terms-row {
    display: flex; align-items: flex-start; gap: 10px;
    margin-bottom: 26px;
  }
  .rp-checkbox {
    width: 16px; height: 16px;
    margin-top: 2px; flex-shrink: 0;
    accent-color: var(--accent); cursor: pointer;
  }
  .rp-terms-label {
    font-size: 13px; font-weight: 300; color: var(--muted); line-height: 1.5;
  }
  .rp-terms-label a { color: var(--accent); text-decoration: none; font-weight: 500; }
  .rp-terms-label a:hover { text-decoration: underline; }

  .rp-btn {
    width: 100%;
    padding: 14px;
    background: var(--accent);
    color: #fff;
    border: none; border-radius: var(--radius);
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.18s, transform 0.12s, opacity 0.18s;
  }
  .rp-btn:hover:not(:disabled) { background: #a84c20; transform: translateY(-1px); }
  .rp-btn:active:not(:disabled) { transform: translateY(0); }
  .rp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .rp-footer {
    text-align: center; margin-top: 24px;
    font-size: 13.5px; font-weight: 300; color: var(--muted);
  }
  .rp-footer a { color: var(--accent); font-weight: 500; text-decoration: none; }
  .rp-footer a:hover { text-decoration: underline; }

  .rp-success {
    text-align: center; padding: 16px 0;
    animation: rise 0.45s cubic-bezier(0.22,1,0.36,1) both;
  }
  .rp-success-icon {
    width: 68px; height: 68px; border-radius: 50%;
    background: rgba(42,122,75,0.10);
    margin: 0 auto 22px;
    display: flex; align-items: center; justify-content: center;
  }
  .rp-success-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px; font-weight: 700; color: var(--ink);
    margin-bottom: 8px;
  }
  .rp-success-body { font-size: 14px; font-weight: 300; color: var(--muted); }
  .rp-success-body strong { color: var(--ink); font-weight: 500; }

  .spinner {
    width: 17px; height: 17px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── Exported helpers (used in tests) ───────────────────────────────────── */
export const validate = (fields) => {
  const errors = {};
  if (!fields.firstName.trim())  errors.firstName = "First name is required";
  if (!fields.lastName.trim())   errors.lastName  = "Last name is required";
  if (!fields.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!fields.password) {
    errors.password = "Password is required";
  } else if (fields.password.length < 8) {
    errors.password = "Must be at least 8 characters";
  }
  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (!fields.agreed) errors.agreed = "You must accept the terms";
  return errors;
};

export const getStrength = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

/* ─── Eye icon ────────────────────────────────────────────────────────────── */
const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const INITIAL_FIELDS = {
  firstName: "", lastName: "", email: "",
  password: "", confirmPassword: "", agreed: false,
};

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function RegistrationPage() {
  const [fields,  setFields]  = useState(INITIAL_FIELDS);
  const [errors,  setErrors]  = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getStrength(fields.password);

  const set = (key, val) => {
    setFields(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="rp-root">
        <div className="rp-card" data-testid="rp-card">
          {success ? (
            <div className="rp-success" data-testid="success-message">
              <div className="rp-success-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
                  stroke="#2a7a4b" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="rp-success-title">Welcome aboard!</div>
              <p className="rp-success-body">
                Your account has been created for <strong>{fields.email}</strong>.
              </p>
            </div>
          ) : (
            <>
              <p className="rp-eyebrow">New account</p>
              <h1 className="rp-title">Join us today.</h1>
              <p className="rp-sub">Create your free account in seconds.</p>

              <form onSubmit={handleSubmit} noValidate data-testid="reg-form">
                <div className="rp-row">
                  <div className="rp-field">
                    <label htmlFor="firstName" className="rp-label">First Name</label>
                    <input id="firstName" data-testid="input-firstName"
                      className={`rp-input${errors.firstName ? " err" : ""}`}
                      placeholder="Jane" value={fields.firstName}
                      onChange={e => set("firstName", e.target.value)} />
                    {errors.firstName && (
                      <p className="rp-err-msg" data-testid="error-firstName">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="rp-field">
                    <label htmlFor="lastName" className="rp-label">Last Name</label>
                    <input id="lastName" data-testid="input-lastName"
                      className={`rp-input${errors.lastName ? " err" : ""}`}
                      placeholder="Doe" value={fields.lastName}
                      onChange={e => set("lastName", e.target.value)} />
                    {errors.lastName && (
                      <p className="rp-err-msg" data-testid="error-lastName">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="rp-field">
                  <label htmlFor="email" className="rp-label">Email Address</label>
                  <input id="email" type="email" data-testid="input-email"
                    className={`rp-input${errors.email ? " err" : ""}`}
                    placeholder="jane@example.com" value={fields.email}
                    onChange={e => set("email", e.target.value)} />
                  {errors.email && (
                    <p className="rp-err-msg" data-testid="error-email">{errors.email}</p>
                  )}
                </div>

                <div className="rp-field">
                  <label htmlFor="password" className="rp-label">Password</label>
                  <div className="rp-pw-wrap">
                    <input id="password" type={showPw ? "text" : "password"}
                      data-testid="input-password"
                      className={`rp-input${errors.password ? " err" : ""}`}
                      placeholder="Min. 8 characters" value={fields.password}
                      onChange={e => set("password", e.target.value)} />
                    <button type="button" className="rp-eye"
                      data-testid="toggle-password"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPw(v => !v)}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                  {fields.password && (
                    <div className="rp-strength" data-testid="strength-bar">
                      {[1,2,3,4].map(i => (
                        <div key={i}
                          className={`rp-seg${strength >= i ? ` active-${strength}` : ""}`}
                          data-testid={`strength-seg-${i}`} />
                      ))}
                    </div>
                  )}
                  {errors.password && (
                    <p className="rp-err-msg" data-testid="error-password">{errors.password}</p>
                  )}
                </div>

                <div className="rp-field">
                  <label htmlFor="confirmPassword" className="rp-label">Confirm Password</label>
                  <div className="rp-pw-wrap">
                    <input id="confirmPassword" type={showCfm ? "text" : "password"}
                      data-testid="input-confirmPassword"
                      className={`rp-input${errors.confirmPassword ? " err" : ""}`}
                      placeholder="Re-enter password" value={fields.confirmPassword}
                      onChange={e => set("confirmPassword", e.target.value)} />
                    <button type="button" className="rp-eye"
                      data-testid="toggle-confirm"
                      aria-label="Toggle confirm password visibility"
                      onClick={() => setShowCfm(v => !v)}>
                      <EyeIcon open={showCfm} />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="rp-err-msg" data-testid="error-confirmPassword">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="rp-terms-row">
                  <input type="checkbox" id="agreed" data-testid="checkbox-agreed"
                    className="rp-checkbox" checked={fields.agreed}
                    onChange={e => set("agreed", e.target.checked)} />
                  <label htmlFor="agreed" className="rp-terms-label">
                    I agree to the <a href="#terms">Terms of Service</a> and{" "}
                    <a href="#privacy">Privacy Policy</a>
                  </label>
                </div>
                {errors.agreed && (
                  <p className="rp-err-msg" style={{ marginBottom: 16 }}
                    data-testid="error-agreed">{errors.agreed}</p>
                )}

                <button type="submit" className="rp-btn"
                  data-testid="submit-btn" disabled={loading}>
                  {loading
                    ? <><div className="spinner" /> Creating account…</>
                    : "Create account"}
                </button>
              </form>

              <p className="rp-footer">
                Already registered? <a href="#login">Sign in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
