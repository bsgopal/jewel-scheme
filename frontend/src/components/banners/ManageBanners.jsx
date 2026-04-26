import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Alert, Snackbar, Switch, FormControlLabel, TextField } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const API = process.env.REACT_APP_API_URL;

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#fffdf8",
  },
};

export default function ManageBanners() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    cta_label: "",
    cta_route: "/newplan",
    image_url: "",
    priority: 1,
    active: true,
  });
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadBanners = async () => {
    try {
      const res = await axios.get(`${API}/api/banners?include_all=true`, { headers });
      setItems(res.data || []);
    } catch (error) {
      setToast({ open: true, message: "Unable to load banners.", severity: "error" });
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);
    setUploading(true);

    try {
      const res = await axios.post(`${API}/api/banners/upload`, data, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
      setForm((prev) => ({ ...prev, image_url: res.data.url }));
    } catch (error) {
      setToast({ open: true, message: "Banner upload failed.", severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      setToast({ open: true, message: "Banner title is required.", severity: "error" });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/api/banners`, form, { headers });
      setForm({
        title: "",
        subtitle: "",
        description: "",
        cta_label: "",
        cta_route: "/newplan",
        image_url: "",
        priority: 1,
        active: true,
      });
      await loadBanners();
      setToast({ open: true, message: "Banner added.", severity: "success" });
    } catch (error) {
      setToast({ open: true, message: "Unable to save banner.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/api/banners/${id}`, { headers });
      await loadBanners();
    } catch (error) {
      setToast({ open: true, message: "Unable to delete banner.", severity: "error" });
    }
  };

  return (
    <div className="app-safe-shell">
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 20 }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(169,126,39,0.12)",
            borderRadius: 22,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(169,126,39,0.16)",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <ArrowBackIcon sx={{ color: "#6b4d26" }} />
          </button>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>Banner Manager</div>
            <div style={{ fontSize: 13, color: "#85684a" }}>Upload promo banners and arrange what shows on the home page.</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 380px) minmax(0, 1fr)", gap: 20 }}>
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(169,126,39,0.12)",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 18px 36px rgba(133, 104, 74, 0.08)",
              display: "grid",
              gap: 14,
              alignContent: "start",
            }}
          >
            <TextField label="Title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} sx={inputSx} />
            <TextField label="Subtitle" value={form.subtitle} onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))} sx={inputSx} />
            <TextField label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} sx={inputSx} multiline rows={3} />
            <TextField label="CTA Label" value={form.cta_label} onChange={(e) => setForm((prev) => ({ ...prev, cta_label: e.target.value }))} sx={inputSx} />
            <TextField label="CTA Route" value={form.cta_route} onChange={(e) => setForm((prev) => ({ ...prev, cta_route: e.target.value }))} sx={inputSx} />
            <TextField label="Priority" type="number" value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value || 1) }))} sx={inputSx} />
            <FormControlLabel control={<Switch checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />} label="Active banner" />

            <label
              style={{
                border: "1.5px dashed rgba(169,126,39,0.28)",
                borderRadius: 16,
                padding: 16,
                background: "#fffaf0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input type="file" accept="image/*" hidden onChange={handleUpload} />
              <UploadFileIcon sx={{ color: "#a9771c" }} />
              <span style={{ fontWeight: 700, color: "#6f5334" }}>{uploading ? "Uploading..." : form.image_url ? "Change banner image" : "Upload banner image"}</span>
            </label>

            {form.image_url ? (
              <img
                src={`${API}${form.image_url}`}
                alt="Banner preview"
                style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(169,126,39,0.12)" }}
              />
            ) : null}

            <button
              onClick={handleCreate}
              disabled={saving}
              style={{
                height: 48,
                border: "none",
                borderRadius: 16,
                background: "linear-gradient(135deg, #7b0000, #c0392b)",
                color: "#fff2c2",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : "Add Banner"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px minmax(0, 1fr)",
                  gap: 16,
                  padding: 16,
                  background: "rgba(255,255,255,0.94)",
                  borderRadius: 22,
                  border: "1px solid rgba(169,126,39,0.12)",
                  boxShadow: "0 16px 30px rgba(133, 104, 74, 0.07)",
                }}
              >
                <div
                  style={{
                    minHeight: 128,
                    borderRadius: 18,
                    background: item.image_url
                      ? `center / cover no-repeat url(${API}${item.image_url})`
                      : "linear-gradient(135deg, #b27b36 0%, #6d311d 100%)",
                  }}
                />
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 21, fontWeight: 800, color: "#3e2b16" }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: "#85684a" }}>{item.subtitle}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        border: "1px solid rgba(163,58,43,0.16)",
                        background: "#fff7f5",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <DeleteOutlineIcon sx={{ color: "#a33a2b" }} />
                    </button>
                  </div>
                  <div style={{ color: "#6f5334", lineHeight: 1.5 }}>{item.description}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "#fff7e8", color: "#8a6b49", fontSize: 12 }}>Priority {item.priority}</span>
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: item.active ? "#eef8f0" : "#fff2f0", color: item.active ? "#2d8a52" : "#a33a2b", fontSize: 12 }}>
                      {item.active ? "Active" : "Inactive"}
                    </span>
                    {item.cta_label ? <span style={{ padding: "6px 10px", borderRadius: 999, background: "#fff", border: "1px solid rgba(169,126,39,0.12)", fontSize: 12 }}>{item.cta_label}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
