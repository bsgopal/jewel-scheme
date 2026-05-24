import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert, Box, Button, FormControlLabel, Snackbar, Switch, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const emptyBanner = {
  title: "",
  subtitle: "",
  description: "",
  cta_label: "",
  cta_route: "/newplan",
  image_url: "",
  priority: 1,
  active: true,
};

const emptyOffer = {
  title: "",
  subtitle: "",
  description: "",
  bonus_value: "",
  valid_to: "",
  image_url: "",
  active: true,
};

const emptyArrival = {
  title: "",
  price: "",
  offer: "",
  image_url: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    backgroundColor: "#fffdf8",
  },
};

function ContentCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.94)",
        border: "1px solid rgba(169,126,39,0.12)",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 16px 30px rgba(133,104,74,0.07)",
        display: "grid",
        gap: 14,
        alignContent: "start",
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#3e2b16" }}>{title}</div>
        <div style={{ marginTop: 4, color: "#85684a", fontSize: 13 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function UploadButton({ label, endpoint, onUploaded, headers }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);
    setUploading(true);

    try {
      const res = await axios.post(`${API}${endpoint}`, data, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data?.url || "");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <label
      style={{
        border: "1.5px dashed rgba(169,126,39,0.28)",
        borderRadius: 14,
        padding: "12px 14px",
        background: "#fffaf0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        fontWeight: 800,
        color: "#6f5334",
      }}
    >
      <input type="file" accept="image/*" hidden onChange={handleUpload} />
      <UploadFileIcon sx={{ color: "#a9771c", fontSize: 19 }} />
      {uploading ? "Uploading..." : label}
    </label>
  );
}

function ItemRow({ item, image, title, meta, active, onDelete }) {
  return (
    <div
      style={{
        border: "1px solid rgba(169,126,39,0.12)",
        borderRadius: 18,
        background: "#fffdf8",
        padding: 12,
        display: "grid",
        gridTemplateColumns: "84px minmax(0, 1fr) auto",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          height: 68,
          borderRadius: 14,
          background: image ? `center / cover no-repeat url(${API}${image})` : "linear-gradient(135deg, #f3dfb2, #b27b36)",
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, color: "#3e2b16", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ color: "#85684a", fontSize: 13, marginTop: 4 }}>{meta}</div>
        {typeof active === "boolean" ? (
          <div style={{ color: active ? "#2d8a52" : "#a33a2b", fontSize: 12, fontWeight: 800, marginTop: 4 }}>
            {active ? "Active" : "Inactive"}
          </div>
        ) : null}
      </div>
      <button
        onClick={() => onDelete(item)}
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          border: "1px solid rgba(163,58,43,0.16)",
          background: "#fff7f5",
          color: "#a33a2b",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
      </button>
    </div>
  );
}

export default function AdminContentWorkspace() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);
  const [activeType, setActiveType] = useState("Banners");
  const [banners, setBanners] = useState([]);
  const [offers, setOffers] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [bannerForm, setBannerForm] = useState(emptyBanner);
  const [offerForm, setOfferForm] = useState(emptyOffer);
  const [arrivalForm, setArrivalForm] = useState(emptyArrival);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [confirmAction, setConfirmAction] = useState(null);

  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  const loadContent = useCallback(async () => {
    try {
      const [bannerRes, offerRes, arrivalRes] = await Promise.all([
        axios.get(`${API}/api/banners?include_all=true`, { headers }),
        axios.get(`${API}/api/offers?include_all=true`, { headers }),
        axios.get(`${API}/api/newarrivals`, { headers }),
      ]);

      setBanners(bannerRes.data || []);
      setOffers(offerRes.data || []);
      setArrivals(arrivalRes.data || []);
    } catch (error) {
      showToast("Unable to load content workspace.", "error");
    }
  }, [headers]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const createBanner = async () => {
    if (!bannerForm.title.trim()) return showToast("Banner title is required.", "error");

    await axios.post(`${API}/api/banners`, bannerForm, { headers });
    setBannerForm(emptyBanner);
    await loadContent();
    showToast("Banner added.");
  };

  const createOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.valid_to) return showToast("Offer title and valid date are required.", "error");

    await axios.post(`${API}/api/offers`, { ...offerForm, bonus_value: Number(offerForm.bonus_value || 0) }, { headers });
    setOfferForm(emptyOffer);
    await loadContent();
    showToast("Offer added.");
  };

  const createArrival = async () => {
    if (!arrivalForm.title.trim() || !arrivalForm.price || !arrivalForm.image_url) {
      return showToast("Arrival name, price, and image are required.", "error");
    }

    await axios.post(`${API}/api/newarrivals`, arrivalForm, { headers });
    setArrivalForm(emptyArrival);
    await loadContent();
    showToast("Arrival added.");
  };

  const deleteItem = async (type, id) => {
    setConfirmAction({
      message: `Delete this ${type.toLowerCase()}?`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        await axios.delete(`${API}/api/${type === "Banners" ? "banners" : type === "Offers" ? "offers" : "newarrivals"}/${id}`, { headers });
        await loadContent();
        showToast(`${type.slice(0, -1)} deleted.`);
      },
    });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {["Banners", "Offers", "Arrivals"].map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            style={{
              height: 40,
              borderRadius: 999,
              border: activeType === type ? "none" : "1px solid rgba(169,126,39,0.14)",
              background: activeType === type ? "linear-gradient(135deg, #7B0000, #C0392B)" : "#fff",
              color: activeType === type ? "#FFD700" : "#6f5334",
              padding: "0 16px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {activeType === "Banners" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
          <ContentCard title="Add Banner" subtitle="Controls the top home carousel.">
            <TextField label="Title" value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} sx={fieldSx} />
            <TextField label="Subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))} sx={fieldSx} />
            <TextField label="CTA Route" value={bannerForm.cta_route} onChange={(e) => setBannerForm((prev) => ({ ...prev, cta_route: e.target.value }))} sx={fieldSx} />
            <TextField label="Priority" type="number" value={bannerForm.priority} onChange={(e) => setBannerForm((prev) => ({ ...prev, priority: Number(e.target.value || 1) }))} sx={fieldSx} />
            <FormControlLabel control={<Switch checked={bannerForm.active} onChange={(e) => setBannerForm((prev) => ({ ...prev, active: e.target.checked }))} />} label="Active" />
            <UploadButton label={bannerForm.image_url ? "Change banner image" : "Upload banner image"} endpoint="/api/banners/upload" headers={headers} onUploaded={(url) => setBannerForm((prev) => ({ ...prev, image_url: url }))} />
            <button onClick={createBanner} style={primaryButtonStyle}><AddIcon sx={{ fontSize: 18 }} /> Add Banner</button>
          </ContentCard>
          <ContentCard title="Current Banners" subtitle={`${banners.length} saved`}>
            {banners.map((item) => (
              <ItemRow key={item.id} item={item} image={item.image_url} title={item.title} meta={`Priority ${item.priority || 1}`} active={item.active} onDelete={() => deleteItem("Banners", item.id)} />
            ))}
          </ContentCard>
        </div>
      ) : null}

      {activeType === "Offers" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
          <ContentCard title="Add Offer" subtitle="Published to the offers section.">
            <TextField label="Title" value={offerForm.title} onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))} sx={fieldSx} />
            <TextField label="Subtitle" value={offerForm.subtitle} onChange={(e) => setOfferForm((prev) => ({ ...prev, subtitle: e.target.value }))} sx={fieldSx} />
            <TextField label="Description" value={offerForm.description} onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))} sx={fieldSx} multiline rows={3} />
            <TextField label="Bonus Value" type="number" value={offerForm.bonus_value} onChange={(e) => setOfferForm((prev) => ({ ...prev, bonus_value: e.target.value }))} sx={fieldSx} />
            <TextField label="Valid To" type="date" value={offerForm.valid_to} onChange={(e) => setOfferForm((prev) => ({ ...prev, valid_to: e.target.value }))} sx={fieldSx} InputLabelProps={{ shrink: true }} />
            <FormControlLabel control={<Switch checked={offerForm.active} onChange={(e) => setOfferForm((prev) => ({ ...prev, active: e.target.checked }))} />} label="Active" />
            <UploadButton label={offerForm.image_url ? "Change offer image" : "Upload offer image"} endpoint="/api/offers/upload" headers={headers} onUploaded={(url) => setOfferForm((prev) => ({ ...prev, image_url: url }))} />
            <button onClick={createOffer} style={primaryButtonStyle}><AddIcon sx={{ fontSize: 18 }} /> Add Offer</button>
          </ContentCard>
          <ContentCard title="Current Offers" subtitle={`${offers.length} saved`}>
            {offers.map((item) => (
              <ItemRow key={item.id} item={item} image={item.image_url} title={item.title} meta={item.valid_to ? `Valid till ${new Date(item.valid_to).toLocaleDateString("en-IN")}` : "No date"} active={item.active} onDelete={() => deleteItem("Offers", item.id)} />
            ))}
          </ContentCard>
        </div>
      ) : null}

      {activeType === "Arrivals" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
          <ContentCard title="Add Arrival" subtitle="Shows in home and new-arrivals screens.">
            <TextField label="Jewellery Name" value={arrivalForm.title} onChange={(e) => setArrivalForm((prev) => ({ ...prev, title: e.target.value }))} sx={fieldSx} />
            <TextField label="Price" type="number" value={arrivalForm.price} onChange={(e) => setArrivalForm((prev) => ({ ...prev, price: e.target.value }))} sx={fieldSx} />
            <TextField label="Offer" value={arrivalForm.offer} onChange={(e) => setArrivalForm((prev) => ({ ...prev, offer: e.target.value }))} sx={fieldSx} />
            <UploadButton label={arrivalForm.image_url ? "Change arrival image" : "Upload arrival image"} endpoint="/api/newarrivals/upload" headers={headers} onUploaded={(url) => setArrivalForm((prev) => ({ ...prev, image_url: url }))} />
            <button onClick={createArrival} style={primaryButtonStyle}><AddIcon sx={{ fontSize: 18 }} /> Add Arrival</button>
          </ContentCard>
          <ContentCard title="Current Arrivals" subtitle={`${arrivals.length} saved`}>
            {arrivals.map((item) => (
              <ItemRow key={item.id} item={item} image={item.imageUrl || item.image_url} title={item.title} meta={`Rs ${Number(item.price || 0).toLocaleString("en-IN")}${item.offer ? ` · ${item.offer}` : ""}`} onDelete={() => deleteItem("Arrivals", item.id)} />
            ))}
          </ContentCard>
        </div>
      ) : null}

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>{toast.message}</Alert>
      </Snackbar>

      <Snackbar open={Boolean(confirmAction)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={() => setConfirmAction(null)}>
        <Alert
          severity="warning"
          onClose={() => setConfirmAction(null)}
          action={(
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                color="inherit"
                size="small"
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  await action?.onConfirm?.();
                }}
              >
                {confirmAction?.confirmLabel || "Confirm"}
              </Button>
            </Box>
          )}
        >
          {confirmAction?.message || ""}
        </Alert>
      </Snackbar>
    </div>
  );
}

const primaryButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #7B0000, #C0392B)",
  color: "#FFD700",
  cursor: "pointer",
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};
