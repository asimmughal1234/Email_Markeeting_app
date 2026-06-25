"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

const defaultSubject = "AI Automation Solutions for Real Estate Businesses";

const templates = {
  realEstateIntro: "Hi {business_name} Team,\n\nI hope you are doing well.\n\nWe provide AI automation and custom software solutions for real estate builders and property businesses, helping them manage leads, automate WhatsApp communication, follow up with buyers, and improve sales workflows.\n\nFor real estate companies, we can build AI WhatsApp chatbots, CRM systems, project websites, buyer portals, broker portals, and automated follow-up workflows that help your team respond faster and convert more inquiries into site visits and bookings.\n\nOur goal is to help {business_name} reduce manual work, organize leads in one place, and make the sales process faster and more efficient.\n\nI would be happy to discuss how AI automation can support your current sales and customer communication process.\n\nBest regards,\nMuhammad Asim\nAI Automation & Full-Stack Solutions\n",
  followUp: "Hi {business_name} Team,\n\nI hope you are doing well.\n\nI wanted to quickly follow up on my previous message regarding AI automation solutions for real estate builders.\n\nWe can help your team automate lead handling, WhatsApp responses, site visit bookings, CRM workflows, and buyer follow-ups so inquiries are managed faster and more efficiently.\n\nPlease let me know if you would be open to a short discussion.\n\nBest regards,\nMuhammad Asim\nAI Automation & Full-Stack Solutions\n",
  shortIntro: "Hi {business_name} Team,\n\nI hope you are doing well.\n\nWe help real estate companies automate lead management, WhatsApp communication, buyer follow-ups, site visit bookings, CRM workflows, and custom web applications using AI automation.\n\nI would be happy to discuss how this can support {business_name}.\n\nBest regards,\nMuhammad Asim\nAI Automation & Full-Stack Solutions\n",
};

const defaultColumnMapping = {
  business_name: "Business Name",
  email: "Email(s)",
  phone_number: "Phone Number",
  website: "Website",
  city: "City",
  rating: "Rating",
  number_of_reviews: "Number of Reviews",
  category: "Category",
  google_maps_url: "Google Maps URL",
};

const defaultTrackingColumns = {
  subject: "email_subject",
  message: "email_message",
  status: "email_status",
  sentAt: "email_sent_at",
  error: "email_error",
  sentEmails: "sent_emails",
  campaignName: "campaign_name",
};

type ThemeMode = "dark" | "light";

type ApiState = {
  loading: boolean;
  error: string;
  data: any;
};

function downloadBase64File(base64: string, fileName: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function MailerApp() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  const [senderEmail, setSenderEmail] = useState("");
  const [senderAppPassword, setSenderAppPassword] = useState("");
  const [senderName, setSenderName] = useState("Muhammad Asim");
  const [replyTo, setReplyTo] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(465);

  const [attachments, setAttachments] = useState<File[]>([]);
  const [sheetName, setSheetName] = useState("Dubai Leads");
  const [campaignName, setCampaignName] = useState("Dubai Real Estate AI Outreach");
  const [sendMode, setSendMode] = useState<"dry-run" | "test-one" | "send-batch">("dry-run");
  const [dailyLimit, setDailyLimit] = useState(10);
  const [delaySeconds, setDelaySeconds] = useState(1);
  const [testEmail, setTestEmail] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState(defaultSubject);
  const [bodyTemplate, setBodyTemplate] = useState(templates.realEstateIntro);
  const [useHtml, setUseHtml] = useState(false);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [unsubscribeText, setUnsubscribeText] = useState(
    "If you no longer want to receive emails from us, reply with 'Unsubscribe'.",
  );
  const [columnMapping, setColumnMapping] = useState(JSON.stringify(defaultColumnMapping, null, 2));
  const [trackingColumns, setTrackingColumns] = useState(JSON.stringify(defaultTrackingColumns, null, 2));
  const [apiState, setApiState] = useState<ApiState>({ loading: false, error: "", data: null });

  const canRun = useMemo(() => Boolean(excelFile), [excelFile]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ema-theme") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
      return;
    }

    document.documentElement.dataset.theme = "dark";
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ema-theme", theme);
  }, [theme]);

  function clearResults() {
    setApiState({ loading: false, error: "", data: null });
    window.setTimeout(() => {
      document.getElementById("top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function createFormData(modeOverride?: "dry-run" | "test-one" | "send-batch") {
    const formData = new FormData();

    if (!excelFile) {
      throw new Error("Please upload an Excel file first.");
    }

    formData.append("excelFile", excelFile);
    attachments.forEach((file) => formData.append("attachments", file));

    formData.append("senderEmail", senderEmail);
    formData.append("senderAppPassword", senderAppPassword);
    formData.append("senderName", senderName);
    formData.append("replyTo", replyTo);
    formData.append("smtpHost", smtpHost);
    formData.append("smtpPort", String(smtpPort));

    formData.append("sheetName", sheetName);
    formData.append("campaignName", campaignName);
    formData.append("sendMode", modeOverride || sendMode);
    formData.append("dailyLimit", String(dailyLimit));
    formData.append("delaySeconds", String(delaySeconds));
    formData.append("testEmail", testEmail);
    formData.append("subjectTemplate", subjectTemplate);
    formData.append("bodyTemplate", bodyTemplate);
    formData.append("useHtml", String(useHtml));
    formData.append("htmlTemplate", htmlTemplate);
    formData.append("unsubscribeText", unsubscribeText);
    formData.append("columnMapping", columnMapping);
    formData.append("trackingColumns", trackingColumns);

    return formData;
  }

  async function callApi(endpoint: string, modeOverride?: "dry-run" | "test-one" | "send-batch") {
    setApiState({ loading: true, error: "", data: null });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: createFormData(modeOverride),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setApiState({ loading: false, error: "", data });
      window.setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (error) {
      setApiState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: null,
      });
      window.setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }

  function onExcelChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setExcelFile(file);
  }

  function onAttachmentsChange(event: ChangeEvent<HTMLInputElement>) {
    setAttachments(Array.from(event.target.files || []));
  }

  function handleTemplateChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value as keyof typeof templates;
    setBodyTemplate(templates[value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sendMode === "dry-run") {
      await callApi("/api/preview", "dry-run");
      return;
    }

    await callApi("/api/send", sendMode);
  }

  return (
    <>
      <div className="app-background" aria-hidden="true">
        <div className="mesh mesh-one" />
        <div className="mesh mesh-two" />
        <div className="mesh mesh-three" />
        <div className="laser-line line-one" />
        <div className="laser-line line-two" />
        <div className="noise-layer" />
        <div className="grid-layer" />
        <div className="particle-field">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index} style={{ "--i": index } as React.CSSProperties} />
          ))}
        </div>
      </div>

      <nav className="top-nav">
        <a className="brand" href="#top" aria-label="Go to top">
          <span className="brand-mark">EMA</span>
          <span>Email Marketing Automation</span>
        </a>

        <div className="nav-links" aria-label="Page sections">
          <a href="#overview">Overview</a>
          <a href="#sender">Sender</a>
          <a href="#upload">Upload</a>
          <a href="#template">Template</a>
          <a href="#mapping">Mapping</a>
          <a href="#results">Results</a>
        </div>

        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          aria-label="Toggle light and dark mode"
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </nav>

      <main id="top" className="shell">
        <section id="overview" className="hero reveal-section">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="orb orb-three" />

          <div className="hero-copy">
            <span className="eyebrow">AI Powered Outreach System</span>
            <h1>Email Marketing Automation</h1>
            <p>
              A polished Excel-to-Gmail campaign workspace for uploading leads, mapping columns,
              previewing personalized emails, sending safe test emails, running controlled batches,
              and downloading updated tracking files.
            </p>

            <div className="hero-highlights" aria-label="Application highlights">
              <div>
                <span>01</span>
                <strong>Upload leads</strong>
                <small>Bring any .xlsx file and map its columns.</small>
              </div>
              <div>
                <span>02</span>
                <strong>Preview safely</strong>
                <small>Check personalized emails before sending.</small>
              </div>
              <div>
                <span>03</span>
                <strong>Run batches</strong>
                <small>Track sent, failed, skipped, and duplicate leads.</small>
              </div>
            </div>
          </div>

          <div className="hero-card float-card">
            <p className="card-label">Active Campaign</p>
            <strong>{campaignName || "Untitled Campaign"}</strong>
            <div className="mini-grid">
              <span>Mode</span><b>{sendMode}</b>
              <span>Limit</span><b>{dailyLimit} emails</b>
              <span>Delay</span><b>{delaySeconds}s</b>
              <span>Theme</span><b>{theme}</b>
            </div>
          </div>
        </section>

        <form className="workspace" onSubmit={handleSubmit}>
          <section id="sender" className="panel sender-panel reveal-section">
            <div className="section-heading">
              <span>00</span>
              <div>
                <h2>Sender Gmail setup</h2>
                <p>Use your own Gmail account for this campaign. These details are used only for the current send request.</p>
              </div>
            </div>

            <div className="security-note">
              <span>🔐</span>
              <p>
                For public deployment, each user should enter their own Gmail and App Password.
                Sender credentials are not saved in Excel, not returned in results, and not stored by the app.
              </p>
            </div>

            <div className="grid two">
              <label>
                Sender Gmail
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="sender@gmail.com"
                  autoComplete="username"
                />
              </label>
              <label>
                Gmail App Password
                <input
                  type="password"
                  value={senderAppPassword}
                  onChange={(e) => setSenderAppPassword(e.target.value)}
                  placeholder="16-character app password"
                  autoComplete="current-password"
                />
              </label>
              <label>
                Sender name
                <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Muhammad Asim" />
              </label>
              <label>
                Reply-to email
                <input type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="Optional" />
              </label>
              <label>
                SMTP host
                <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
              </label>
              <label>
                SMTP port
                <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} />
              </label>
            </div>
          </section>

          <section id="upload" className="panel upload-panel reveal-section">
            <div className="section-heading">
              <span>01</span>
              <div>
                <h2>Upload & campaign setup</h2>
                <p>Upload Excel leads and define how this campaign should run.</p>
              </div>
            </div>

            <label className="dropzone">
              <input type="file" accept=".xlsx" onChange={onExcelChange} />
              <span className="upload-icon">⇧</span>
              <strong>Upload Excel File</strong>
              <small>{excelFile ? "File selected and ready for preview." : "Browse or drop an .xlsx lead file here."}</small>
            </label>

            <div className="grid two">
              <label>
                Sheet name
                <input value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Leave blank to use first sheet" />
              </label>
              <label>
                Campaign name
                <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
              </label>
              <label>
                Send mode
                <select value={sendMode} onChange={(e) => setSendMode(e.target.value as any)}>
                  <option value="dry-run">Dry run preview</option>
                  <option value="test-one">Send one test email</option>
                  <option value="send-batch">Send real batch</option>
                </select>
              </label>
              <label>
                Test email
                <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="yourtest@gmail.com" />
              </label>
              <label>
                Batch limit
                <input type="number" min="1" max="100" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
              </label>
              <label>
                Delay seconds
                <input type="number" min="0" max="10" value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} />
              </label>
            </div>
          </section>

          <section id="template" className="panel reveal-section">
            <div className="section-heading">
              <span>02</span>
              <div>
                <h2>Template & attachments</h2>
                <p>Select a reusable email template, personalize it, and attach documents when needed.</p>
              </div>
            </div>

            <div className="grid two">
              <label>
                Template
                <select onChange={handleTemplateChange} defaultValue="realEstateIntro">
                  <option value="realEstateIntro">Real estate AI intro</option>
                  <option value="shortIntro">Short intro</option>
                  <option value="followUp">Follow-up</option>
                </select>
              </label>
              <label>
                Subject
                <input value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} />
              </label>
            </div>

            <label>
              Email body
              <textarea className="body-editor" value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} />
            </label>

            <div className="grid two">
              <label>
                Attachments
                <input type="file" multiple onChange={onAttachmentsChange} />
                <small>{attachments.length} file(s) selected</small>
              </label>
              <label>
                Unsubscribe footer
                <input value={unsubscribeText} onChange={(e) => setUnsubscribeText(e.target.value)} />
              </label>
            </div>

            <label className="check-row">
              <input type="checkbox" checked={useHtml} onChange={(e) => setUseHtml(e.target.checked)} />
              Send HTML version too
            </label>

            {useHtml && (
              <label>
                HTML template
                <textarea value={htmlTemplate} onChange={(e) => setHtmlTemplate(e.target.value)} placeholder="<p>Hi {business_name} Team...</p>" />
              </label>
            )}
          </section>

          <section id="mapping" className="panel reveal-section">
            <div className="section-heading">
              <span>03</span>
              <div>
                <h2>Flexible column mapping</h2>
                <p>Change these mappings when your Excel format changes. Templates can keep using the same placeholders.</p>
              </div>
            </div>

            <div className="grid two">
              <label>
                Source column mapping JSON
                <textarea className="code-editor" value={columnMapping} onChange={(e) => setColumnMapping(e.target.value)} />
              </label>
              <label>
                Tracking columns JSON
                <textarea className="code-editor" value={trackingColumns} onChange={(e) => setTrackingColumns(e.target.value)} />
              </label>
            </div>
          </section>

          <div className="action-bar">
            <button type="button" className="ghost" disabled={!canRun || apiState.loading} onClick={() => callApi("/api/preview", "dry-run")}>
              Preview only
            </button>
            <button type="submit" disabled={!canRun || apiState.loading}>
              {apiState.loading ? "Processing..." : sendMode === "send-batch" ? "Run batch" : sendMode === "test-one" ? "Send test" : "Preview"}
            </button>
          </div>
        </form>

        <section id="results" className="results-anchor reveal-section">
          {apiState.error && (
            <div className="result error-box">
              <div className="result-header">
                <div>
                  <span className="eyebrow">Error</span>
                  <h2>Something needs attention</h2>
                </div>
                <button type="button" className="ghost danger-clear" onClick={clearResults}>
                  Clear results
                </button>
              </div>
              <p>{apiState.error}</p>
            </div>
          )}

          {apiState.data && (
            <div className="result">
              <div className="result-header">
                <div>
                  <span className="eyebrow">Result</span>
                  <h2>Campaign output</h2>
                </div>
                <div className="result-actions">
                  {apiState.data.updatedWorkbookBase64 && (
                    <button
                      type="button"
                      className="download"
                      onClick={() => downloadBase64File(apiState.data.updatedWorkbookBase64, apiState.data.downloadFileName || "updated-leads.xlsx")}
                    >
                      Download updated Excel
                    </button>
                  )}
                  <button type="button" className="ghost danger-clear" onClick={clearResults}>
                    Clear results
                  </button>
                </div>
              </div>

              {apiState.data.summary && (
                <div className="stats">
                  <div><span>Total rows</span><b>{apiState.data.summary.totalRows}</b></div>
                  <div><span>Ready emails</span><b>{apiState.data.summary.validEmails}</b></div>
                  <div><span>Skipped rows</span><b>{apiState.data.summary.skippedRows}</b></div>
                  <div><span>Duplicates</span><b>{apiState.data.summary.duplicateEmails}</b></div>
                </div>
              )}

              {apiState.data.previews && (
                <div className="preview-list">
                  {apiState.data.previews.map((preview: any, index: number) => (
                    <article key={`${preview.rowNumber}-${preview.to}-${index}`} className={`preview-card ${preview.status}`}>
                      <div className="preview-top">
                        <strong>{preview.businessName || "No business name"}</strong>
                        <span>{preview.status}</span>
                      </div>
                      <p><b>To:</b> {preview.to || "No email"}</p>
                      {preview.subject && <p><b>Subject:</b> {preview.subject}</p>}
                      {preview.reason && <p className="muted">{preview.reason}</p>}
                      {preview.body && <pre>{preview.body}</pre>}
                    </article>
                  ))}
                </div>
              )}

              {apiState.data.logs && (
                <div className="log-list">
                  {apiState.data.logs.map((log: any, index: number) => (
                    <div key={index} className={`log-item ${log.status}`}>
                      <span>{log.status}</span>
                      <strong>{log.businessName || "Row " + log.rowNumber}</strong>
                      <p>{log.email} — {log.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bottom-clear">
                <button type="button" className="ghost danger-clear" onClick={clearResults}>
                  Remove all results from frontend
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
