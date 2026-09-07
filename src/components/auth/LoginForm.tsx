/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/src/elements/ui/button"; 
import { Card, CardContent } from "@/src/elements/ui/card";
import { Input } from "@/src/elements/ui/input";
import { useGetIsDemoModeQuery, useLoginMutation, useGetPublicRolesQuery } from "@/src/redux/api/authApi";
import { useGetPagesQuery } from "@/src/redux/api/pageApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/elements/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { setCredentials, setLoading } from "@/src/redux/reducers/authSlice";
import { LoginRequest } from "@/src/types/auth";
import { Label } from "@radix-ui/react-label";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "../../constants";
import { DynamicLogo } from "./common/DynamicLogo";
import { t } from "i18next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

import { getUrlWithBasePath } from "../../utils";

const resolveUrl = (url?: string): string => {
  if (!url) return "";
  
  // Replace backslashes with forward slashes for cross-platform compatibility
  const normalizedUrl = url.replace(/\\/g, "/");

  if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://") || normalizedUrl.startsWith("data:")) {
    return normalizedUrl;
  }

  const baseUrl = (STORAGE_URL || "").endsWith("/") ? STORAGE_URL.slice(0, -1) : STORAGE_URL;

  if (normalizedUrl.startsWith("/uploads/")) {
    return `${baseUrl}${normalizedUrl}`;
  }
  if (normalizedUrl.startsWith("uploads/")) {
    return `${baseUrl}/${normalizedUrl}`;
  }
  if (normalizedUrl.startsWith("/")) {
    return getUrlWithBasePath(normalizedUrl);
  }
  return getUrlWithBasePath(`/${normalizedUrl}`);
};

const DEFAULT_FAVICON = getUrlWithBasePath("/assets/logos/sidebarLogo.svg");

function applyFavicon(href: string) {
  if (typeof window === "undefined" || !href) return;
  const links = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
  if (links.length > 0) {
    links.forEach((link: any) => {
      if (link.href !== href) link.href = href;
    });
  } else {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    document.head.appendChild(link);
  }
}

import { AuthControls } from "./common/AuthControls";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings.data);
  const [login, { isLoading }] = useLoginMutation();
  const { data: brandingData, isSuccess } = useGetIsDemoModeQuery();
  const { data: rolesData } = useGetPublicRolesQuery();
  const { data: pagesData } = useGetPagesQuery({});
  const isDemoMode = brandingData?.is_demo_mode ?? false;

  const pagesList = pagesData?.data?.pages || [];
  const hasPrivacyPolicy = pagesList.some((p) => p.slug === "privacy-policy" && p.status);
  const hasTerms = pagesList.some((p) => p.slug === "terms-and-conditions" && p.status);
  const hasRefund = pagesList.some((p) => p.slug === "refund-policy" && p.status);

  const callbackUrl = searchParams.get("callbackUrl") || ROUTES.Dashboard;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [role_id, setRoleId] = useState("");

  useEffect(() => {
    if (!brandingData || !isSuccess) return;

    const faviconHref = resolveUrl(brandingData?.favicon_url) || DEFAULT_FAVICON;
    const apply = () => applyFavicon(faviconHref);

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: false });
    const interval = setInterval(apply, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [brandingData, isSuccess]);

  useEffect(() => {
    if (rolesData?.success && rolesData.data.length > 0 && !role_id) {
      const superAdmin = rolesData.data.find((r) => r.name.toLowerCase() === "super_admin");
      if (superAdmin) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRoleId(superAdmin._id);
      } else {
        setRoleId(rolesData.data[0]._id);
      }
    }
  }, [rolesData, role_id]);

  const fillDemoCredentials = () => {
    setIdentifier("admin@example.com");
    setPassword("123456789");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(setLoading(true));

    try {
      const loginData: LoginRequest = {
        identifier: identifier.trim(),
        password,
        role_id: role_id || undefined,
      };

      const response = await login(loginData).unwrap();

      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
        })
      );

      const nextUrl = callbackUrl.includes("?") ? `${callbackUrl}&login_success=true` : `${callbackUrl}?login_success=true`;
      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "An error occurred during login");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex flex-col only992:flex-row bg-auth-bg dark:bg-page-body relative overflow-hidden">
      <AuthControls />

      {/* Left panel — brand / illustration (hidden below 992px) */}
      <div className="hidden only992:flex only992:w-[46%] relative flex-col justify-between p-12 overflow-hidden bg-linear-to-br from-(--ft-navy) via-(--ft-navy) to-(--ft-blue) text-white">
        {/* Decorative global network */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <circle cx="200" cy="200" r="150" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="200" r="50" fill="none" stroke="white" strokeWidth="1" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="white" strokeWidth="1" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute top-16 right-10 w-3 h-3 rounded-full bg-(--ft-cyan) shadow-[0_0_16px_4px_rgba(0,194,255,0.6)] animate-pulse" />
        <div className="absolute bottom-32 left-16 w-2 h-2 rounded-full bg-(--ft-cyan) shadow-[0_0_12px_3px_rgba(0,194,255,0.6)] animate-pulse" />
        <div className="absolute top-1/2 left-8 w-2.5 h-2.5 rounded-full bg-white/70 shadow-[0_0_10px_3px_rgba(255,255,255,0.4)] animate-pulse" />

        <div className="relative z-10">
          <DynamicLogo className="h-10 w-auto object-contain brightness-0 invert" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Automate Your Business<br />Communication With Smart<br />WhatsApp Solutions
          </h2>
          <p className="text-white/70 text-sm max-w-sm">
            One connected platform for logistics teams to manage WhatsApp messaging, customer communication, and cargo updates — worldwide.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="w-2 h-2 rounded-full bg-(--ft-cyan)" /> Global Delivery Network
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <span className="w-2 h-2 rounded-full bg-(--ft-cyan)" /> Real-time Messaging
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()} {settings?.app_name || t('common_app_name')}. All rights reserved.</p>
      </div>

      {/* Right panel — glass login card */}
      <div className="flex-1 flex flex-col items-center justify-center p-4.5 relative">
        <div className="w-full max-w-md relative">
          <Card className="w-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl overflow-hidden rounded-2xl dark:bg-(--card-color)/80 dark:border dark:border-(--card-border-color)">
            <CardContent className="pt-12 sm:p-8 p-5">
              {/* Logo / Icon */}
              <div className="flex flex-col items-center mb-8 only992:hidden">
                <DynamicLogo />
              </div>
              <div className="flex flex-col mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-(--text-green-primary) mb-2">Welcome Back To FreighTrack</h1>
                <p className="text-sm text-slate-500 dark:text-gray-400">Manage customer communication, automate WhatsApp messaging, and grow your logistics business.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex flex-col dark:text-gray-300">
                    Enter your email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input id="email" type="text" placeholder="Email or phone number" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="dark:border-(--card-border-color) dark:bg-page-body pl-10 h-12 pe-3.75 border-slate-200 focus:border-none shadow-none focus:ring-none" required disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex flex-col dark:text-gray-300">
                    Enter your password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 dark:bg-page-body dark:border-(--card-border-color) h-12 border-slate-200 shadow-none focus:border-none focus:ring-none" required disabled={isLoading} />
                    <Button type="button" onClick={() => setShowPassword(!showPassword)} className="bg-transparent hover:bg-transparent shadow-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" disabled={isLoading} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex flex-col dark:text-gray-300">Select your role</Label>
                  <Select value={role_id} onValueChange={setRoleId}>
                    <SelectTrigger className="h-12 border-slate-200 dark:bg-page-body dark:border-(--card-border-color) shadow-none focus:border-none focus:ring-none">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-(--card-color) dark:border-(--card-border-color) z-110">
                      {rolesData?.data
                        ?.filter((role) => !["user", "agent"].includes(role.name.toLowerCase()))
                        .map((role) => (
                          <SelectItem key={role._id} value={role._id} className="cursor-pointer dark:hover:bg-zinc-800">
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-14 text-white font-medium text-base transition-all shadow-md shadow-primary/20" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login to Admin Panel"}
                  <Lock className="w-4 h-4" />
                </Button>
              </form>

              {isDemoMode && (
                <>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-(--card-border-color)" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500 dark:bg-(--card-color) dark:text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-(--light-primary) rounded-lg border border-success-border-light justify-center flex cursor-pointer dark:bg-transparent dark:border-(--card-border-color)" onClick={fillDemoCredentials}>
                    <p className="text-sm font-semibold text-slate-600 dark:text-gray-400">Demo Credentials</p>
                  </div>
                </>
              )}

              <div className="mt-6 text-center">
                <Link href={ROUTES.ForgotPassword} prefetch={false} className="text-sm text-(--text-green-primary) hover:text-blue-700 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="relative z-10 p-8 text-center">
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
            {hasPrivacyPolicy && (
              <Link
                href={`${ROUTES.PublicPage}/privacy-policy`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400"
              >
                Privacy Policy
              </Link>
            )}
            {hasTerms && (
              <Link
                href={`${ROUTES.PublicPage}/terms-and-conditions`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400"
              >
                Terms of Service
              </Link>
            )}
            {hasRefund && (
              <Link
                href={`${ROUTES.PublicPage}/refund-policy`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400"
              >
                Refund Policy
              </Link>
            )}
          </div>
          <p className="text-[13px] text-gray-400 font-semibold">
            © {new Date().getFullYear()} {settings?.app_name || t('common_app_name')} WhatsApp API. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginForm;
