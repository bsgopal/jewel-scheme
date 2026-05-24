import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Snackbar,
  Switch,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import bannerOne from "./images/banner1.jpg";
import { getBackTarget } from "../utils/navigation";

const API = process.env.REACT_APP_API_URL;
const fallbackPlanBanner = `${process.env.PUBLIC_URL}/images/banner1.png`;

const resolveAssetUrl = (path, fallback = fallbackPlanBanner) => {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  return `${API?.replace(/\/$/, "") || ""}${path.startsWith("/") ? "" : "/"}${path}`;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#FDFAF5",
    color: "#2A0000",
    "& fieldset": { borderColor: "rgba(139,26,26,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(139,26,26,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#8B0000", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(139,26,26,0.5)", fontSize: "0.85rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#8B0000" },
  "& .MuiInputBase-input": { color: "#2A0000", fontSize: "0.88rem" },
  "& .MuiSelect-icon": { color: "rgba(139,26,26,0.5)" },
};

const menuProps = {
  MenuProps: {
    PaperProps: {
      sx: {
        backgroundColor: "#FDF5F0",
        color: "#2A0000",
        border: "1px solid rgba(139,26,26,0.1)",
        "& .MuiMenuItem-root:hover": { backgroundColor: "rgba(139,26,26,0.07)" },
      },
    },
  },
};

const defaultTerms = [
  "Minimum subscription period applies to the selected plan.",
  "Benefits apply only to active and completed schemes.",
  "Store approval is required before publication.",
];

const defaultPlanData = {
  groupCode: "",
  planName: "",
  planType: "Monthly",
  amountPerInst: "",
  jewelleryType: "All",
  duration: "11",
  isFlexible: false,
  bonus: 0,
  totalBalance: 0,
  note: "",
  benefits: ["Flexible monthly savings"],
  status: "Active",
  priority: 1,
  bannerPreview: bannerOne,
  imageUrl: "",
  terms: defaultTerms,
  makingChargeDiscount: 0,
  wastageDiscount: 0,
  diamondDiscount: 0,
  extraBonusPercentage: 0,
  popular: false,
};

function SectionCard({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          border: "1.5px solid rgba(139,26,26,0.15)",
          boxShadow: "0 6px 24px rgba(139,26,26,0.08)",
          padding: "22px 20px",
          marginBottom: 18,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #8B0000, #C0392B)" }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "linear-gradient(135deg, #8B0000, #C0392B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 12px rgba(139,26,26,0.2)",
            }}
          >
            <Icon sx={{ fontSize: 19, color: "#FFD700" }} />
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#3B0000", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</span>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function FormGrid({ children }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
      {children}
    </Box>
  );
}

export default function CreateNewPlan() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const backTarget = getBackTarget(location, "/newplan");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [goldRate, setGoldRate] = useState(0);
  const [planData, setPlanData] = useState(defaultPlanData);

  // Restore form data from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('planFormData');
    if (savedData && !id) {
      try {
        setPlanData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to restore form data:', e);
      }
    }
  }, [id]);

  // Save form data to sessionStorage whenever it changes
  useEffect(() => {
    if (!id) {
      sessionStorage.setItem('planFormData', JSON.stringify(planData));
    }
  }, [planData, id]);

  useEffect(() => {
    axios
      .get(`${API}/api/gold-rate/current`)
      .then((response) => setGoldRate(Number(response.data?.data?.gold22K || 0)))
      .catch(() => setGoldRate(0));
  }, []);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`${API}/api/plan-catalog/${id}`)
      .then((res) => {
        const plan = res.data?.data;
        if (!plan) return;

        setPlanData({
          ...defaultPlanData,
          groupCode: plan.groupCode || "",
          planName: plan.name || "",
          planType: plan.plan_type || "Monthly",
          amountPerInst: plan.minAmount || "",
          jewelleryType: plan.jewellery_type || "All",
          duration: String(plan.totalInstallments || 11),
          isFlexible: plan.type === "flexible",
          bonus: plan.bonusPercentage || 0,
          note: plan.description || "",
          benefits: plan.features?.length ? plan.features : defaultPlanData.benefits,
          status: plan.active ? "Active" : "Inactive",
          priority: plan.priority || 1,
          bannerPreview: resolveAssetUrl(plan.imageUrl, bannerOne),
          imageUrl: plan.imageUrl || "",
          terms: plan.terms?.length ? plan.terms : defaultTerms,
          makingChargeDiscount: plan.benefits?.makingChargeDiscount ?? 0,
          wastageDiscount: plan.benefits?.wastageDiscount ?? 0,
          diamondDiscount: plan.benefits?.diamondDiscount ?? 0,
          extraBonusPercentage: plan.benefits?.extraBonusPercentage || 0,
          popular: Boolean(plan.popular),
        });
      })
      .catch(() => {
        setSnackbar({ open: true, message: "Unable to load plan details.", severity: "error" });
      });
  }, [id]);

  useEffect(() => {
    const amount = Number(planData.amountPerInst || 0);
    const duration = Number(planData.duration || 0);

    if (amount > 0 && duration > 0) {
      const totalBalance = amount * duration;
      setPlanData((prev) => ({ ...prev, totalBalance }));
      return;
    }

    setPlanData((prev) => ({ ...prev, totalBalance: 0 }));
  }, [planData.amountPerInst, planData.duration]);

  const liveRateLabel = useMemo(() => (goldRate ? `Rs ${goldRate.toLocaleString("en-IN")}/g` : "Rate unavailable"), [goldRate]);

  const handleInput = (field, value) => {
    const nextValue = field === "groupCode" || field === "planName" ? String(value || "").toUpperCase() : value;
    setPlanData((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleBenefitChange = (index, value) => {
    const benefits = [...planData.benefits];
    benefits[index] = value;
    setPlanData((prev) => ({ ...prev, benefits }));
  };

  const handleTermChange = (index, value) => {
    const terms = [...planData.terms];
    terms[index] = value;
    setPlanData((prev) => ({ ...prev, terms }));
  };

  const handleBannerUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const res = await axios.post(`${API}/api/plan-catalog/upload`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setPlanData((prev) => ({
        ...prev,
        imageUrl: res.data?.url || "",
        bannerPreview: res.data?.url ? resolveAssetUrl(res.data.url, prev.bannerPreview || bannerOne) : prev.bannerPreview,
      }));
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Banner upload failed.",
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    const payload = {
      groupCode: planData.groupCode,
      planName: planData.planName,
      planType: planData.planType,
      schemeType: planData.isFlexible ? "flexible" : "monthly",
      jewelleryType: planData.jewelleryType,
      amountPerInst: Number(planData.amountPerInst || 0),
      maxAmount: Number(planData.totalBalance || planData.amountPerInst || 0),
      totalInstallments: Number(planData.duration || 11),
      tenure: `${Number(planData.duration || 11)} months`,
      note: planData.note,
      features: planData.benefits.filter(Boolean),
      terms: planData.terms.filter(Boolean),
      priority: Number(planData.priority || 1),
      bonus: Number(planData.bonus || 0),
      bannerPreview: planData.imageUrl,
      popular: Boolean(planData.popular),
      active: planData.status === "Active",
      isFlexible: Boolean(planData.isFlexible),
      benefits: {
        makingChargeDiscount: Number(planData.makingChargeDiscount || 0),
        wastageDiscount: Number(planData.wastageDiscount || 0),
        diamondDiscount: Number(planData.diamondDiscount || 0),
        extraBonusPercentage: Number(planData.extraBonusPercentage || 0),
      },
    };

    try {
      if (id) {
        await axios.put(`${API}/api/plan-catalog/${id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } else {
        await axios.post(`${API}/api/plan-catalog`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }

      setSnackbar({
        open: true,
        message: id ? "Plan updated successfully." : "Plan created successfully.",
        severity: "success",
      });

      setTimeout(() => navigate("/newplan"), 900);
      // Clear saved form data on successful submission
      sessionStorage.removeItem('planFormData');
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || "Unable to save plan.", severity: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => setPlanData(defaultPlanData);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <AnimatePresence>
        {submitting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}>
            <LinearProgress sx={{ "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #8B0000, #FFD700)" }, backgroundColor: "rgba(139,26,26,0.1)" }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: "linear-gradient(135deg, #7B0000, #A50000)", padding: "calc(env(safe-area-inset-top, 0px) + 6px) 16px 8px", minHeight: "calc(56px + env(safe-area-inset-top, 0px))", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid rgba(255,200,80,0.4)", boxShadow: "0 6px 24px rgba(100,0,0,0.4)", position: "sticky", top: 0, zIndex: 100 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(backTarget)} style={{ background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,200,80,0.4)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.2s" }}>
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 22 }} />
        </motion.button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#FFD700", lineHeight: 1, letterSpacing: "0.5px" }}>{id ? "EDIT PLAN" : "CREATE PLAN"}</div>
          <div style={{ fontSize: "0.5rem", color: "rgba(255,220,130,0.8)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "2px", fontWeight: 600 }}>Live gold rate: {liveRateLabel}</div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 14px 40px" }}>
        <form onSubmit={handleSubmit}>
          <SectionCard title="Plan Identity" icon={DiamondOutlinedIcon}>
            <FormGrid>
              <TextField fullWidth label="Group Code" value={planData.groupCode} onChange={(e) => handleInput("groupCode", e.target.value)} sx={fieldSx} size="small" />
              <TextField select fullWidth label="Status" value={planData.status} onChange={(e) => handleInput("status", e.target.value)} sx={fieldSx} size="small" SelectProps={{ MenuProps: menuProps }}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
              <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1" } }}>
                <TextField fullWidth label="Plan Name *" value={planData.planName} onChange={(e) => handleInput("planName", e.target.value)} required sx={fieldSx} size="small" />
              </Box>
              <TextField select fullWidth label="Metal Type *" value={planData.jewelleryType} onChange={(e) => handleInput("jewelleryType", e.target.value)} required sx={fieldSx} size="small" SelectProps={{ MenuProps: menuProps }}>
                {["Gold", "Silver", "Platinum", "Diamond"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="Plan Type" value={planData.planType} onChange={(e) => handleInput("planType", e.target.value)} sx={fieldSx} size="small" SelectProps={{ MenuProps: menuProps }}>
                {["Monthly", "Quarterly", "Yearly"].map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </TextField>
            </FormGrid>
          </SectionCard>

          <SectionCard title="Financial Details" icon={CheckCircleOutlineIcon}>
            <FormGrid>
              <TextField fullWidth label="Amount / Installment (Rs) *" type="number" value={planData.amountPerInst} onChange={(e) => handleInput("amountPerInst", e.target.value)} required sx={fieldSx} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><span style={{ color: "#8B0000", fontSize: "0.9rem" }}>Rs</span></InputAdornment> }} />
              <TextField fullWidth label="Duration (Months) *" type="number" value={planData.duration} onChange={(e) => handleInput("duration", e.target.value)} required sx={fieldSx} size="small" />
              <TextField fullWidth label="Target Value (Rs)" value={Number(planData.totalBalance || 0).toLocaleString("en-IN")} size="small" sx={{ ...fieldSx, "& .MuiOutlinedInput-root": { ...fieldSx["& .MuiOutlinedInput-root"], backgroundColor: "rgba(139,26,26,0.04)" } }} InputProps={{ readOnly: true }} />
              <TextField fullWidth label="Bonus (%)" type="number" value={planData.bonus} onChange={(e) => handleInput("bonus", e.target.value)} sx={fieldSx} size="small" />
              <TextField fullWidth label="Priority" type="number" value={planData.priority} onChange={(e) => handleInput("priority", e.target.value)} sx={fieldSx} size="small" />
              <TextField fullWidth label="Making Charge Discount (%)" type="number" value={planData.makingChargeDiscount} onChange={(e) => handleInput("makingChargeDiscount", e.target.value)} sx={fieldSx} size="small" />
              <TextField fullWidth label="Wastage Discount (%)" type="number" value={planData.wastageDiscount} onChange={(e) => handleInput("wastageDiscount", e.target.value)} sx={fieldSx} size="small" />
              <TextField fullWidth label="Diamond Discount (%)" type="number" value={planData.diamondDiscount} onChange={(e) => handleInput("diamondDiscount", e.target.value)} sx={fieldSx} size="small" />
              <TextField fullWidth label="Extra Bonus (%)" type="number" value={planData.extraBonusPercentage} onChange={(e) => handleInput("extraBonusPercentage", e.target.value)} sx={fieldSx} size="small" />
            </FormGrid>

            <FormControlLabel control={<Switch checked={planData.isFlexible} onChange={(e) => handleInput("isFlexible", e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#8B0000" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#8B0000" } }} />} label={<span style={{ fontSize: "0.82rem", color: "#555" }}>Flexible plan</span>} sx={{ mt: 1.5 }} />
            <FormControlLabel control={<Switch checked={planData.popular} onChange={(e) => handleInput("popular", e.target.checked)} sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#8B0000" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#8B0000" } }} />} label={<span style={{ fontSize: "0.82rem", color: "#555" }}>Highlight as popular plan</span>} />
          </SectionCard>

          <SectionCard title="Description" icon={CheckCircleOutlineIcon}>
            <TextField fullWidth multiline rows={3} label="Additional Note / Description" value={planData.note} onChange={(e) => handleInput("note", e.target.value)} sx={fieldSx} size="small" />
          </SectionCard>

          <SectionCard title="Plan Banner" icon={UploadFileIcon}>
            <label style={{ cursor: "pointer" }}>
              <input type="file" accept="image/*" hidden onChange={handleBannerUpload} />
              <div style={{ border: "1.5px dashed rgba(139,26,26,0.3)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(139,26,26,0.03)" }}>
                <UploadFileIcon sx={{ color: "#8B0000", fontSize: 20 }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8B0000" }}>{uploading ? "Uploading..." : planData.imageUrl ? "Change Banner" : "Upload Banner Image"}</span>
              </div>
            </label>
            <AnimatePresence>
              {planData.bannerPreview && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,26,26,0.15)" }}>
                  <img src={planData.bannerPreview} alt="Banner preview" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          <SectionCard title="Plan Features" icon={CheckCircleOutlineIcon}>
            <AnimatePresence>
              {planData.benefits.map((benefit, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                    <TextField fullWidth label={`Feature ${index + 1}`} value={benefit} onChange={(e) => handleBenefitChange(index, e.target.value)} sx={fieldSx} size="small" />
                    <IconButton onClick={() => setPlanData((prev) => ({ ...prev, benefits: prev.benefits.filter((_, itemIndex) => itemIndex !== index) || [""] }))} disabled={planData.benefits.length === 1} sx={{ color: "rgba(192,57,43,0.7)", "&:disabled": { opacity: 0.2 } }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <button type="button" onClick={() => setPlanData((prev) => ({ ...prev, benefits: [...prev.benefits, ""] }))} style={{ background: "none", border: "1px dashed rgba(139,26,26,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#8B0000", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <AddIcon style={{ fontSize: 16 }} /> Add Feature
            </button>
          </SectionCard>

          <SectionCard title="Terms & Conditions" icon={CheckCircleOutlineIcon}>
            {planData.terms.map((term, index) => (
              <TextField key={index} fullWidth label={`Term ${index + 1}`} value={term} multiline onChange={(e) => handleTermChange(index, e.target.value)} sx={{ ...fieldSx, mb: 1.5 }} size="small" />
            ))}
          </SectionCard>

          <div style={{ display: "flex", gap: 12, marginTop: 4, marginBottom: 20 }}>
            <button type="button" onClick={handleReset} style={{ flex: 1, height: 46, borderRadius: 12, border: "1.5px solid rgba(139,26,26,0.3)", background: "transparent", color: "#8B0000", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>
              Reset
            </button>
            <motion.button type="submit" disabled={submitting || uploading} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} style={{ flex: 2, height: 46, borderRadius: 12, border: "none", background: submitting ? "rgba(139,26,26,0.3)" : "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(139,26,26,0.3)" }}>
              {submitting ? "Saving..." : id ? "Update Plan" : "Create Plan"}
            </motion.button>
          </div>
        </form>
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar((state) => ({ ...state, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbar((state) => ({ ...state, open: false }))} severity={snackbar.severity} sx={{ borderRadius: "12px" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
