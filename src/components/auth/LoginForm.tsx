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
import { AlertCircle, ArrowUpRight, CheckCircle2, Eye, EyeOff, Lock, Mail, MessageCircle, ShieldCheck, Zap } from "lucide-react";
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
    <div className="min-h-screen flex flex-col only992:flex-row bg-[#f3f7f6] dark:bg-[#071512] relative overflow-hidden">
      <AuthControls />

      {/* Left panel — brand / illustration (hidden below 992px) */}
      <div className="hidden only992:flex only992:w-[47%] relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-[#08251d] text-white">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_15%,rgba(37,211,102,0.28),transparent_30%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.03)_100%)]" />
        <div className="absolute -right-28 top-24 h-96 w-96 rounded-full border border-[#25d366]/20" />
        <div className="absolute -right-16 top-36 h-72 w-72 rounded-full border border-[#25d366]/15" />
        <div className="absolute bottom-28 left-14 h-2 w-2 rounded-full bg-[#25d366] shadow-[0_0_18px_5px_rgba(37,211,102,0.5)]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25d366] text-[#08251d] shadow-lg shadow-[#25d366]/20">
              <MessageCircle className="h-6 w-6 fill-current" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">WABOT</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#9bd7b0]">MULTIPLESTACK</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-xl space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#25d366]/30 bg-[#25d366]/10 px-3 py-1.5 text-xs font-medium text-[#b6ebc6]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#25d366]" /> Messaging operations, connected
          </div>
          <h2 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">
            Move every customer conversation forward.
          </h2>
          <p className="max-w-md text-sm leading-6 text-[#b8cdc3]">
            Manage WhatsApp API traffic, sales conversations, notifications, and team workflows from one focused command center.
          </p>
          <div className="grid max-w-md grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <Zap className="mb-5 h-5 w-5 text-[#25d366]" />
              <p className="text-sm font-medium">Fast automation</p>
              <p className="mt-1 text-xs leading-5 text-[#91aca0]">Trigger customer updates with confidence.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-5 h-5 w-5 text-[#25d366]" />
              <p className="text-sm font-medium">Built for teams</p>
              <p className="mt-1 text-xs leading-5 text-[#91aca0]">Keep access and operations organized.</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#759487]">© {new Date().getFullYear()} {settings?.app_name || t('common_app_name')}. All rights reserved.</p>
      </div>

      {/* Right panel — focused sign-in surface */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 relative">
        <div className="w-full max-w-[430px] relative">
          <Card className="w-full overflow-hidden rounded-2xl border border-[#dbe8e1] bg-white shadow-[0_24px_70px_-28px_rgba(8,37,29,0.35)] dark:border-white/10 dark:bg-[#0d211a]">
            <CardContent className="p-6 sm:p-9">
              {/* Logo / Icon */}
              <div className="mb-8 flex items-center gap-3 only992:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25d366] text-[#08251d]">
                  <MessageCircle className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight text-[#08251d] dark:text-white">WABOT</p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#6d8d7d] dark:text-[#9bd7b0]">MULTIPLESTACK</p>
                </div>
              </div>
              <div className="flex flex-col mb-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#25a95a]">Operations console</p>
                <h1 className="text-2xl font-semibold tracking-tight text-[#102c21] dark:text-white">Welcome back</h1>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-gray-400">Sign in to manage your WhatsApp API workspace and customer traffic.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 flex flex-col dark:text-gray-300">
                    Work email or phone
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input id="email" type="text" placeholder="you@company.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="dark:border-white/10 dark:bg-[#071512] pl-10 h-12 pe-3.75 rounded-lg border-[#dbe8e1] bg-[#f8fbf9] shadow-none focus:border-[#25a95a] focus:ring-2 focus:ring-[#25d366]/20" required disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 flex flex-col dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 dark:bg-[#071512] dark:border-white/10 h-12 rounded-lg border-[#dbe8e1] bg-[#f8fbf9] shadow-none focus:border-[#25a95a] focus:ring-2 focus:ring-[#25d366]/20" required disabled={isLoading} />
                    <Button type="button" onClick={() => setShowPassword(!showPassword)} className="bg-transparent hover:bg-transparent shadow-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" disabled={isLoading} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 flex flex-col dark:text-gray-300">Workspace role</Label>
                  <Select value={role_id} onValueChange={setRoleId}>
                    <SelectTrigger className="h-12 rounded-lg border-[#dbe8e1] bg-[#f8fbf9] shadow-none focus:border-[#25a95a] focus:ring-2 focus:ring-[#25d366]/20 dark:bg-[#071512] dark:border-white/10">
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

                <Button type="submit" className="group w-full h-12 rounded-lg bg-[#128c4a] text-white font-semibold text-sm transition-all shadow-lg shadow-[#128c4a]/20 hover:bg-[#0e753d]" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Enter workspace"}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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

                  <div className="mt-6 p-3 bg-[#effaf2] rounded-lg border border-[#ccebd5] justify-center flex cursor-pointer dark:bg-[#123021] dark:border-white/10" onClick={fillDemoCredentials}>
                    <p className="text-sm font-semibold text-[#287c45] dark:text-[#a9e3b8]">Use demo workspace credentials</p>
                  </div>
                </>
              )}

              <div className="mt-6 text-center">
                <Link href={ROUTES.ForgotPassword} prefetch={false} className="text-sm text-[#168c4c] hover:text-[#0e753d] hover:underline font-medium">
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
