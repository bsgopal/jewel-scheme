import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import CreateAccount from "./components/CreateAccount";
import Home from "./components/Home";
import Sidemenu from "./components/Sidemenu";
import OTP from "./components/OTP";
import CreateNewPlan from "./components/CreateNewPlan";
import NewPlan from "./components/NewPlan";
import JoinNewPlan from "./components/plans/JoinNewPlan";
import PaymentPage from "./components/plans/paymentpage";
import RateEntry from "./components/RateEntry";
import NewArrivals from "./components/newarrivals/NewArrivals";
import ManageNewArrivals from "./components/newarrivals/ManageNewArrivals";
import ManageBanners from "./components/banners/ManageBanners";
import MyPlans from "./components/MyPlans";
import PlanDetails from "./components/PlanDetails";
import PaymentHistory from "./components/payment-history/paymentHistoryList";
import PaymentHistoryDetails from "./components/payment-history/PaymentHistoryDetails";
import ForgotPassword from "./components/forgot-password/ForgotPassword";
import VerifyForgotOtp from "./components/forgot-password/VerifyForgotOtp";
import ResetPassword from "./components/forgot-password/ResetPassword";
import Wallet from "./components/Features/Wallet";
import Profile from "./components/Features/Profile";
import AgentDashboard from "./components/Agent/AgentDashboard";
import AgentAmountManagement from "./components/Agent/AgentAmountManagement";
import AgentCollectInstallment from "./components/Agent/AgentCollectInstallment";
import AdminManage from "./components/admin/AdminManage";
import ProtectedRoute from "./components/Features/ProtectedRoute";
import OffersPage from "./components/offers/OffersPage";
import ManageOffers from "./components/offers/ManageOffers";
import ManageAgents from "./components/admin/ManageAgents";
import AgentDetail from "./components/admin/AgentDetail";
import OfferDetails from "./components/offers/OfferDetails";
import AddEditOffer from "./components/offers/AddEditOffer";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import axios from "axios";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const hasToken = Boolean(localStorage.getItem("token"));
  const isGuest = localStorage.getItem("isGuest") === "true";

  axios.defaults.withCredentials = true;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    PushNotifications.requestPermissions().then((result) => {
      if (result.receive === "granted") {
        PushNotifications.register();
      }
    });

    PushNotifications.addListener("registration", (token) => {
      console.log("FCM TOKEN:", token.value);
    });

    PushNotifications.addListener("registrationError", (error) => {
      console.error("FCM ERROR:", error);
    });
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListener;

    const registerBackHandler = async () => {
      backListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack || window.history.length > 1) {
          navigate(-1);
          return;
        }

        if (location.pathname !== "/Home") {
          navigate("/Home", { replace: true });
          return;
        }

        CapacitorApp.exitApp();
      });
    };

    registerBackHandler();

    return () => {
      backListener?.remove();
    };
  }, [location.pathname, navigate]);

  const addNewPlan = (newPlanData) => {
    setPlans((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newPlanData,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const updatePlan = (id, updatedData) => {
    setPlans((prev) => prev.map((plan) => (plan.id === Number(id) ? { ...plan, ...updatedData } : plan)));
  };

  return (
    <Routes>
      <Route path="/" element={hasToken || isGuest ? <Navigate to="/Home" replace /> : <Login />} />
      <Route path="/CreateAccount" element={<ProtectedRoute roles={["admin"]}><CreateAccount /></ProtectedRoute>} />
      <Route path="/otp" element={<OTP />} />
      <Route path="/forgotPassword" element={<ForgotPassword />} />
      <Route path="/verifyForgotOtp" element={<VerifyForgotOtp />} />
      <Route path="/resetPassword" element={<ResetPassword />} />

      <Route path="/offers" element={<ProtectedRoute><OffersPage /></ProtectedRoute>} />
      <Route path="/offers/new" element={<ProtectedRoute roles={["admin", "staff"]}><AddEditOffer /></ProtectedRoute>} />
      <Route path="/offers/:id" element={<ProtectedRoute><OfferDetails /></ProtectedRoute>} />
      <Route path="/Home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/Sidemenu" element={<ProtectedRoute><Sidemenu /></ProtectedRoute>} />
      <Route path="/rateentry" element={<ProtectedRoute roles={["admin"]}><RateEntry /></ProtectedRoute>} />
      <Route path="/my-plans" element={<ProtectedRoute><MyPlans /></ProtectedRoute>} />
      <Route path="/plan-details/:id" element={<ProtectedRoute><PlanDetails /></ProtectedRoute>} />
      <Route path="/payment-history" element={<ProtectedRoute roles={["admin"]}><PaymentHistory /></ProtectedRoute>} />
      <Route path="/payment-history/:userId" element={<ProtectedRoute roles={["admin"]}><PaymentHistoryDetails /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/agent-dashboard" element={<ProtectedRoute roles={["agent", "admin", "staff"]}><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/dashboard" element={<Navigate to="/agent-dashboard" replace />} />
      <Route path="/agent/manage-amounts" element={<ProtectedRoute roles={["agent", "admin", "staff"]}><AgentAmountManagement /></ProtectedRoute>} />
      <Route path="/agent/collect-installment" element={<ProtectedRoute roles={["agent", "admin", "staff"]}><AgentCollectInstallment /></ProtectedRoute>} />
      <Route path="/admin-manage" element={<ProtectedRoute roles={["admin"]}><AdminManage /></ProtectedRoute>} />
      <Route path="/createnewplan" element={<ProtectedRoute roles={["admin"]}><CreateNewPlan onCreatePlan={addNewPlan} /></ProtectedRoute>} />
      <Route path="/createnewplan/:id" element={<ProtectedRoute roles={["admin"]}><CreateNewPlan onUpdatePlan={updatePlan} plans={plans} /></ProtectedRoute>} />
      <Route path="/newplan" element={<ProtectedRoute><NewPlan /></ProtectedRoute>} />
      <Route path="/newplan/:id" element={<ProtectedRoute><NewPlan /></ProtectedRoute>} />
      <Route path="/plans/joinnewplan/:planId" element={<ProtectedRoute><JoinNewPlan /></ProtectedRoute>} />
      <Route path="/plans/payment/:planId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
      <Route path="/newarrivals" element={<ProtectedRoute><NewArrivals /></ProtectedRoute>} />
      <Route path="/manage-newarrivals" element={<ProtectedRoute roles={["admin"]}><ManageNewArrivals /></ProtectedRoute>} />
      <Route path="/manage-banners" element={<ProtectedRoute roles={["admin"]}><ManageBanners /></ProtectedRoute>} />
      <Route path="/manage-offers" element={<ProtectedRoute roles={["admin"]}><ManageOffers /></ProtectedRoute>} />
      <Route path="/offers/edit/:id" element={<ProtectedRoute roles={["admin", "staff"]}><AddEditOffer /></ProtectedRoute>} />
      <Route path="/admin/agents" element={<ProtectedRoute roles={["admin"]}><ManageAgents /></ProtectedRoute>} />
      <Route path="/admin/agents/:id" element={<ProtectedRoute roles={["admin"]}><AgentDetail /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
