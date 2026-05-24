import React, { useState } from "react";
import {
  TextField, MenuItem, InputAdornment, IconButton, Checkbox, Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#FDFAF5",
    color: "#2A0000",
    "& fieldset": { borderColor: "rgba(139,26,26,0.2)" },
    "&:hover fieldset": { borderColor: "rgba(139,26,26,0.5)" },
    "&.Mui-focused fieldset": { borderColor: "#8B0000", borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root": { color: "rgba(139,26,26,0.5)", fontSize: "0.88rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#8B0000" },
  "& .MuiInputBase-input": { color: "#2A0000", fontSize: "0.9rem" },
  "& .MuiSelect-icon": { color: "rgba(139,26,26,0.5)" },
  "& .MuiFormHelperText-root": { color: "#C0392B", fontSize: "0.72rem" },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": { color: "rgba(139,26,26,0.4)", fontSize: 18 },
};

const menuPaper = {
  MenuProps: {
    PaperProps: {
      sx: {
        backgroundColor: "#FDF5F0",
        color: "#2A0000",
        "& .MuiMenuItem-root:hover": { backgroundColor: "rgba(139,26,26,0.08)" },
      },
    },
  },
};

function SectionBadge({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(139,26,26,0.25))" }} />
      <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "#8B0000", letterSpacing: "0.2em", fontFamily: "'Montserrat', sans-serif", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(139,26,26,0.25))" }} />
    </div>
  );
}

export default function CreateAccount() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isAdminCreator = role === "admin";

  const [formData, setFormData] = useState({
    firstname: "",
    title: "",
    email: "",
    mobile: "",
    address: "",
    area: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    nominee_name: "",
    nominee_mobile: "",
    nominee_relation: "",
    role: "customer",
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const shouldCollectCustomerDetails = !isAdminCreator || formData.role === "customer";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.title) nextErrors.title = "Select a title";
    if (!formData.firstname) nextErrors.firstname = "Full name is required";
    if (!formData.email) nextErrors.email = "Email is required";
    if (!formData.mobile || formData.mobile.length !== 10) nextErrors.mobile = "Valid 10-digit mobile required";
    if (!formData.password) nextErrors.password = "Password is required";
    if (formData.password && formData.password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword) nextErrors.confirmPassword = "Please confirm password";
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    if (shouldCollectCustomerDetails) {
      if (!formData.address) nextErrors.address = "Address is required";
      if (!formData.area) nextErrors.area = "Area is required";
      if (!formData.state) nextErrors.state = "State is required";
      if (!formData.city) nextErrors.city = "City is required";
      if (!formData.pincode) nextErrors.pincode = "Pincode is required";
      if (!formData.nominee_name) nextErrors.nominee_name = "Nominee name is required";
      if (!formData.nominee_mobile || formData.nominee_mobile.length !== 10) nextErrors.nominee_mobile = "Valid 10-digit nominee mobile required";
      if (!formData.nominee_relation) nextErrors.nominee_relation = "Relation is required";
    }

    if (isAdminCreator && !formData.role) nextErrors.role = "Role is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    if (!agreed) {
      setSnackbar({ open: true, message: "Please agree to Terms & Conditions", severity: "warning" });
      return;
    }

    try {
      const payload = {
        firstname: formData.firstname,
        title: formData.title,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        role: isAdminCreator ? formData.role : "customer",
        isSuperAdminCreate: isAdminCreator,
        address: {
          street: formData.address,
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        nominee: {
          name: formData.nominee_name,
          phone: formData.nominee_mobile,
          relation: formData.nominee_relation,
        },
      };

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, payload);
      if (!res.data.success) {
        throw new Error(res.data.message || "Registration failed");
      }

      const userId = res.data.userId;
      localStorage.setItem("tempUserId", userId);
      setSnackbar({
        open: true,
        message: isAdminCreator ? "User created successfully." : "Account created. Check email for OTP.",
        severity: "success",
      });

      if (isAdminCreator) {
        setTimeout(() => navigate("/admin-manage"), 1000);
      } else {
        setTimeout(() => navigate("/otp", { state: { email: formData.email, userId } }), 1000);
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors || [];
      if (apiErrors.length) {
        const fieldErrors = {};
        apiErrors.forEach((item) => {
          if (item?.field) fieldErrors[item.field] = item.message;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || "Registration failed",
        severity: "error",
      });
    }
  };

  const handleBack = () => {
    if (localStorage.getItem("role")) navigate("/Home");
    else navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", fontFamily: "'Montserrat', sans-serif", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div style={{ background: "linear-gradient(135deg, #7B0000, #A50000)", padding: "0 16px", height: 60, display: "flex", alignItems: "center", gap: 12, borderBottom: "1.5px solid rgba(255,200,80,0.3)", boxShadow: "0 3px 16px rgba(100,0,0,0.35)", position: "sticky", top: 0, zIndex: 100 }}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleBack} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,200,80,0.3)", borderRadius: 10, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ArrowBackIcon style={{ color: "#FFD700", fontSize: 20 }} />
        </motion.button>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#FFD700", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {isAdminCreator ? "Create User" : "Create Account"}
          </div>
          <div style={{ fontSize: "0.45rem", color: "rgba(255,220,130,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            {isAdminCreator ? "Add new member to platform" : "Join RENIC Gold Schemes"}
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 24 }} style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 50px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid rgba(139,26,26,0.1)", boxShadow: "0 8px 32px rgba(139,26,26,0.07)", padding: "24px 22px" }}>
          <SectionBadge label="Personal Information" />

          <TextField select fullWidth label="Title *" name="title" value={formData.title} onChange={handleChange} error={!!errors.title} helperText={errors.title} sx={{ ...fieldSx, mb: 2 }} SelectProps={menuPaper}>
            {["Mr", "Mrs", "Ms", "Dr", "Prof"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>

          <TextField fullWidth label="Full Name *" name="firstname" value={formData.firstname} onChange={handleChange} error={!!errors.firstname} helperText={errors.firstname} InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon /></InputAdornment> }} sx={{ ...fieldSx, mb: 2 }} />
          <TextField fullWidth label="Email *" name="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} type="email" InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon /></InputAdornment> }} sx={{ ...fieldSx, mb: 2 }} />
          <TextField fullWidth label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} error={!!errors.mobile} helperText={errors.mobile} type="tel" inputProps={{ maxLength: 10 }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIphoneIcon /></InputAdornment> }} sx={fieldSx} />

          {isAdminCreator && (
            <>
              <SectionBadge label="Role Assignment" />
              <TextField select fullWidth label="Select Role *" name="role" value={formData.role} onChange={handleChange} error={!!errors.role} helperText={errors.role} sx={fieldSx} SelectProps={menuPaper}>
                {[["customer", "Customer"], ["agent", "Agent"], ["staff", "Staff"], ["admin", "Admin"]].map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </TextField>
            </>
          )}

          {shouldCollectCustomerDetails && (
            <>
              <SectionBadge label="Address Details" />
              <TextField fullWidth label="Address *" name="address" value={formData.address} onChange={handleChange} error={!!errors.address} helperText={errors.address} InputProps={{ startAdornment: <InputAdornment position="start"><HomeOutlinedIcon /></InputAdornment> }} sx={{ ...fieldSx, mb: 2 }} />
              <TextField fullWidth label="Area / Locality *" name="area" value={formData.area} onChange={handleChange} error={!!errors.area} helperText={errors.area} sx={{ ...fieldSx, mb: 2 }} />
              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <TextField select fullWidth label="State *" name="state" value={formData.state} onChange={handleChange} error={!!errors.state} helperText={errors.state} sx={fieldSx} SelectProps={menuPaper}>
                  {["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Maharashtra"].map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </TextField>
                <TextField fullWidth label="City *" name="city" value={formData.city} onChange={handleChange} error={!!errors.city} helperText={errors.city} sx={fieldSx} />
              </div>
              <TextField fullWidth label="Pincode *" name="pincode" value={formData.pincode} onChange={handleChange} error={!!errors.pincode} helperText={errors.pincode} inputProps={{ maxLength: 6 }} sx={fieldSx} />

              <SectionBadge label="Nominee Details" />
              <TextField fullWidth label="Nominee Full Name *" name="nominee_name" value={formData.nominee_name} onChange={handleChange} error={!!errors.nominee_name} helperText={errors.nominee_name} InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon /></InputAdornment> }} sx={{ ...fieldSx, mb: 2 }} />
              <div style={{ display: "flex", gap: 12 }}>
                <TextField fullWidth label="Nominee Mobile *" name="nominee_mobile" value={formData.nominee_mobile} onChange={handleChange} error={!!errors.nominee_mobile} helperText={errors.nominee_mobile} type="tel" inputProps={{ maxLength: 10 }} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIphoneIcon /></InputAdornment> }} sx={fieldSx} />
                <TextField fullWidth label="Relation *" name="nominee_relation" value={formData.nominee_relation} onChange={handleChange} error={!!errors.nominee_relation} helperText={errors.nominee_relation} sx={fieldSx} />
              </div>
            </>
          )}

          <SectionBadge label="Security" />
          <TextField fullWidth label="Password *" name="password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} type={showPassword ? "text" : "password"} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end" sx={{ color: "rgba(139,26,26,0.4)" }}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} sx={{ ...fieldSx, mb: 2 }} />
          <TextField fullWidth label="Confirm Password *" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} type={showConfirmPassword ? "text" : "password"} InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>, endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end" sx={{ color: "rgba(139,26,26,0.4)" }}>{showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} sx={fieldSx} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20, padding: "14px 14px", borderRadius: 12, background: "rgba(139,26,26,0.04)", border: "1px solid rgba(139,26,26,0.12)" }}>
            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} sx={{ color: "rgba(139,26,26,0.3)", "&.Mui-checked": { color: "#8B0000" }, p: 0.3, mt: 0.2 }} />
            <span style={{ fontSize: "0.75rem", color: "#666", lineHeight: 1.6 }}>
              I agree to the Terms & Conditions and Privacy Policy.
            </span>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={handleRegister} style={{ width: "100%", height: 50, marginTop: 20, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7B0000, #C0392B)", color: "#FFD700", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Montserrat', sans-serif", boxShadow: "0 6px 20px rgba(139,26,26,0.35)" }}>
            {isAdminCreator ? "Create User" : "Create Account"}
          </motion.button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ fontSize: "0.78rem", color: "#999" }}>
              Already have an account?{" "}
              <span onClick={() => navigate("/")} style={{ color: "#8B0000", fontWeight: 700, cursor: "pointer" }}>
                Sign In
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((state) => ({ ...state, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MuiAlert onClose={() => setSnackbar((state) => ({ ...state, open: false }))} severity={snackbar.severity} elevation={6} variant="filled" sx={{ borderRadius: "12px" }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}
