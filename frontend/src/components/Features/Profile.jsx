import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { getDefaultRoute, goBackOrFallback } from "../../utils/navigation";

const blankForm = {
  name: "",
  email: "",
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
  },
  businessProfile: {
    shopName: "",
    category: "",
    tagline: "",
    about: "",
    whatsapp: "",
    website: "",
    instagram: "",
    featuredProducts: [],
    offerTitle: "",
    offerDetails: "",
    isPublicProfile: true,
  },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    backgroundColor: "#fffdf8",
    "& fieldset": { borderColor: "rgba(169,126,39,0.18)" },
    "&:hover fieldset": { borderColor: "#c89b3c" },
    "&.Mui-focused fieldset": { borderColor: "#c89b3c", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "#8a6b49" },
};

function toFormData(data) {
  return {
    name: data?.name || "",
    email: data?.email || "",
    address: {
      street: data?.address?.street || "",
      city: data?.address?.city || "",
      state: data?.address?.state || "",
      pincode: data?.address?.pincode || "",
    },
    businessProfile: {
      shopName: data?.businessProfile?.shopName || "",
      category: data?.businessProfile?.category || "",
      tagline: data?.businessProfile?.tagline || "",
      about: data?.businessProfile?.about || "",
      whatsapp: data?.businessProfile?.whatsapp || "",
      website: data?.businessProfile?.website || "",
      instagram: data?.businessProfile?.instagram || "",
      featuredProducts: data?.businessProfile?.featuredProducts || [],
      offerTitle: data?.businessProfile?.offerTitle || "",
      offerDetails: data?.businessProfile?.offerDetails || "",
      isPublicProfile: data?.businessProfile?.isPublicProfile ?? true,
    },
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/me`);
        const data = res.data.data || null;
        setProfile(data);
        setForm(toFormData(data));
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const address = profile?.address
    ? [profile.address.street, profile.address.city, profile.address.state, profile.address.pincode]
        .filter(Boolean)
        .join(", ")
    : "-";

  const business = profile?.businessProfile || {};
  const featuredProducts = business.featuredProducts || [];

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field, value) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const updateBusiness = (field, value) => {
    setForm((prev) => ({
      ...prev,
      businessProfile: { ...prev.businessProfile, [field]: value },
    }));
  };

  const handleCancel = () => {
    setForm(toFormData(profile));
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address,
        businessProfile: {
          ...form.businessProfile,
          featuredProducts: form.businessProfile.featuredProducts
            .map((item) => `${item || ""}`.trim())
            .filter(Boolean),
        },
      };

      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/profile`, payload);
      const data = res.data.data || null;
      setProfile(data);
      setForm(toFormData(data));
      setEditing(false);
      setNotice({ open: true, message: "Profile updated successfully.", severity: "success" });
    } catch (error) {
      setNotice({
        open: true,
        message: error.response?.data?.message || "Unable to update profile.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#b88324" }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 3 }}>
        <Typography sx={{ color: "#7c3428", fontWeight: 700 }}>Unable to load profile.</Typography>
      </Box>
    );
  }

  return (
    <Box className="app-safe-shell" sx={{ py: 2 }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            p: 2,
            borderRadius: "20px",
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 16px 36px rgba(133, 104, 74, 0.08)",
          }}
        >
          <IconButton onClick={() => goBackOrFallback(navigate, location, getDefaultRoute())} sx={{ color: "#b88324" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#3e2b16" }}>My Profile</Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 1, flexWrap: "wrap" }}>
            {editing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancel}
                  sx={{ borderColor: "rgba(169,126,39,0.18)", color: "#6f5334", textTransform: "none", fontWeight: 700 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #c89b3c 0%, #e0b254 100%)",
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ borderColor: "rgba(169,126,39,0.18)", color: "#8a6518", textTransform: "none", fontWeight: 700 }}
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: "24px",
            background: "linear-gradient(180deg, rgba(255,251,243,0.97) 0%, rgba(255,243,221,0.94) 100%)",
            border: "1px solid rgba(169,126,39,0.12)",
            boxShadow: "0 20px 44px rgba(133, 104, 74, 0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap" }}>
            <Avatar
              sx={{
                width: 82,
                height: 82,
                bgcolor: "#d9ae52",
                color: "#fff",
                fontSize: 32,
                fontWeight: 800,
              }}
            >
              {(profile.name || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#3e2b16" }}>{profile.name}</Typography>
              <Typography sx={{ mt: 0.5, color: "#85684a" }}>{profile.email}</Typography>
              <Typography sx={{ mt: 0.5, color: "#85684a" }}>{profile.phone}</Typography>
              {business.shopName ? (
                <Typography sx={{ mt: 1, color: "#8a6518", fontWeight: 700 }}>{business.shopName}</Typography>
              ) : null}
            </Box>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: "999px",
                bgcolor: "rgba(200,155,60,0.14)",
                border: "1px solid rgba(169,126,39,0.16)",
                color: "#8a6518",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {profile.role}
            </Box>
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(169,126,39,0.12)" }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            {[
              ["Customer ID", profile.customerId || "-"],
              ["Verified", profile.isVerified ? "Yes" : "No"],
              ["Wallet Balance", `Rs ${Number(profile.walletBalance || 0).toLocaleString("en-IN")}`],
              ["Wallet Gold", `${Number(profile.walletGoldBalance || 0).toFixed(4)} g`],
              ["Total Savings", `Rs ${Number(profile.totalSavings || 0).toLocaleString("en-IN")}`],
              ["Total Gold", `${Number(profile.totalGoldWeight || 0).toFixed(4)} g`],
              ["Preferred Branch", profile.preferredBranch?.branchName || "-"],
              ["Address", address],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  p: 2,
                  borderRadius: "16px",
                  background: "#fff",
                  border: "1px solid rgba(169,126,39,0.1)",
                }}
              >
                <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>{label}</Typography>
                <Typography sx={{ mt: 0.8, fontSize: 16, fontWeight: 700, color: "#3e2b16" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 3, borderColor: "rgba(169,126,39,0.12)" }} />

          <Box sx={{ display: "grid", gap: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#3e2b16" }}>Business Promotion</Typography>
            <Typography sx={{ color: "#85684a" }}>
              This section lets every user show their profile, promote products, and explain their latest offers.
            </Typography>

            {editing ? (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <TextField label="Your Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Street Address" value={form.address.street} onChange={(e) => updateAddress("street", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="City" value={form.address.city} onChange={(e) => updateAddress("city", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="State" value={form.address.state} onChange={(e) => updateAddress("state", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Pincode" value={form.address.pincode} onChange={(e) => updateAddress("pincode", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Shop / Brand Name" value={form.businessProfile.shopName} onChange={(e) => updateBusiness("shopName", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Category" value={form.businessProfile.category} onChange={(e) => updateBusiness("category", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Tagline" value={form.businessProfile.tagline} onChange={(e) => updateBusiness("tagline", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="WhatsApp Number" value={form.businessProfile.whatsapp} onChange={(e) => updateBusiness("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))} fullWidth sx={fieldSx} />
                  <TextField label="Website" value={form.businessProfile.website} onChange={(e) => updateBusiness("website", e.target.value)} fullWidth sx={fieldSx} />
                  <TextField label="Instagram" value={form.businessProfile.instagram} onChange={(e) => updateBusiness("instagram", e.target.value)} fullWidth sx={fieldSx} />
                </Box>
                <TextField
                  label="About Your Business"
                  value={form.businessProfile.about}
                  onChange={(e) => updateBusiness("about", e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={fieldSx}
                />
                <TextField
                  label="Featured Products"
                  helperText="Add one product per line"
                  value={form.businessProfile.featuredProducts.join("\n")}
                  onChange={(e) => updateBusiness("featuredProducts", e.target.value.split("\n"))}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={fieldSx}
                />
                <TextField
                  label="Offer Title"
                  value={form.businessProfile.offerTitle}
                  onChange={(e) => updateBusiness("offerTitle", e.target.value)}
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label="Offer Details"
                  value={form.businessProfile.offerDetails}
                  onChange={(e) => updateBusiness("offerDetails", e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={fieldSx}
                />
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, borderRadius: "16px", background: "#fff" }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: "#3e2b16" }}>Public profile</Typography>
                    <Typography sx={{ fontSize: 13, color: "#85684a" }}>
                      Keep this enabled if this profile should be shown publicly later.
                    </Typography>
                  </Box>
                  <Switch checked={Boolean(form.businessProfile.isPublicProfile)} onChange={(e) => updateBusiness("isPublicProfile", e.target.checked)} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  {[
                    ["Shop / Brand", business.shopName || "-"],
                    ["Category", business.category || "-"],
                    ["Tagline", business.tagline || "-"],
                    ["WhatsApp", business.whatsapp || "-"],
                    ["Website", business.website || "-"],
                    ["Instagram", business.instagram || "-"],
                    ["Public Profile", business.isPublicProfile ? "Enabled" : "Hidden"],
                  ].map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        background: "#fff",
                        border: "1px solid rgba(169,126,39,0.1)",
                      }}
                    >
                      <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>{label}</Typography>
                      <Typography sx={{ mt: 0.8, fontSize: 16, fontWeight: 700, color: "#3e2b16" }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ p: 2.25, borderRadius: "18px", background: "#fff", border: "1px solid rgba(169,126,39,0.1)" }}>
                  <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>About</Typography>
                  <Typography sx={{ mt: 1, color: "#3e2b16", lineHeight: 1.7 }}>
                    {business.about || "No business description added yet."}
                  </Typography>
                </Box>

                <Box sx={{ p: 2.25, borderRadius: "18px", background: "#fff", border: "1px solid rgba(169,126,39,0.1)" }}>
                  <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>Featured Products</Typography>
                  <Box sx={{ mt: 1.25, display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {featuredProducts.length ? (
                      featuredProducts.map((item) => (
                        <Box
                          key={item}
                          sx={{
                            px: 1.5,
                            py: 0.8,
                            borderRadius: "999px",
                            bgcolor: "rgba(200,155,60,0.14)",
                            color: "#8a6518",
                            fontWeight: 700,
                          }}
                        >
                          {item}
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#85684a" }}>No products added yet.</Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ p: 2.25, borderRadius: "18px", background: "#fff", border: "1px solid rgba(169,126,39,0.1)" }}>
                  <Typography sx={{ fontSize: 12, color: "#8a6b49" }}>Current Offer</Typography>
                  <Typography sx={{ mt: 1, fontSize: 20, fontWeight: 800, color: "#3e2b16" }}>
                    {business.offerTitle || "No offer title added yet."}
                  </Typography>
                  <Typography sx={{ mt: 1, color: "#3e2b16", lineHeight: 1.7 }}>
                    {business.offerDetails || "No offer details added yet."}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            sx={{
              mt: 3,
              borderColor: "rgba(163,58,43,0.24)",
              color: "#7c3428",
              fontWeight: 700,
              textTransform: "none",
            }}
            onClick={() => {
              localStorage.clear();
              delete axios.defaults.headers.common.Authorization;
              navigate("/");
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={3000}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice.severity} onClose={() => setNotice((prev) => ({ ...prev, open: false }))}>
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
