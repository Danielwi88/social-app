import { getMe } from "@/api/me";
import { searchUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAuth, selectAuth, setUser } from "@/features/auth/authSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { AVATAR_FALLBACK_SRC, handleAvatarError } from "@/lib/avatar";
import { LogoGlyph } from "@/shared/logo";
import { useAppDispatch, useAppSelector } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

const normalizeAvatarUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const withVersionParam = (src: string, version: number): string => {
  if (!src) return AVATAR_FALLBACK_SRC;
  try {
    const origin =
      typeof window === "undefined" || src.startsWith("http") ? undefined : window.location.origin;
    const url = new URL(src, origin);
    url.searchParams.set("v", String(version));
    return url.toString();
  } catch {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}v=${version}`;
  }
};

export function AppLayout() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { token, user, avatarVersion } = useAppSelector(selectAuth);
  const fetching = useRef(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [avatarSyncing, setAvatarSyncing] = useState(false);
  const normalizedInitialAvatar = normalizeAvatarUrl(user?.avatarUrl);
  const [avatarSrc, setAvatarSrc] = useState(() =>
    normalizedInitialAvatar ? withVersionParam(normalizedInitialAvatar, avatarVersion) : AVATAR_FALLBACK_SRC
  );
  const lastAvatarRef = useRef<string | undefined>(normalizedInitialAvatar);
  const lastVersionRef = useRef<number>(avatarVersion);

  const debounced = useDebounce(searchTerm, 350);
  const SEARCH_LIMIT = 6;
  const searchEnabled = debounced.trim().length >= 2;

  const searchQuery = useQuery({
    queryKey: ["app-nav-search", debounced, SEARCH_LIMIT],
    queryFn: () => searchUsers(debounced, 1, SEARCH_LIMIT),
    enabled: searchEnabled,
    staleTime: 15_000,
  });

  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || user || fetching.current) return;
    fetching.current = true;
    getMe()
      .then((me) => {
        dispatch(
          setUser({
            id: me.id,
            username: me.username,
            displayName: me.displayName,
            avatarUrl: me.avatarUrl,
          })
        );
      })
      .catch(() => {
        dispatch(clearAuth());
        nav("/login", { replace: true });
      })
      .finally(() => {
        fetching.current = false;
      });
  }, [dispatch, token, user, nav]);

  useEffect(() => {
    if (!searchFocused && mobileSearchOpen) {
      setSearchFocused(true);
    }
  }, [mobileSearchOpen, searchFocused]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainers = [desktopSearchRef.current, mobileSearchRef.current];
      if (!searchContainers.some((node) => node && node.contains(target))) {
        setSearchFocused(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRefreshStart = () => setAvatarSyncing(true);
    const handleRefreshEnd = () => setAvatarSyncing(false);

    window.addEventListener("navbar-refresh-start", handleRefreshStart);
    window.addEventListener("navbar-refresh-end", handleRefreshEnd);

    return () => {
      window.removeEventListener("navbar-refresh-start", handleRefreshStart);
      window.removeEventListener("navbar-refresh-end", handleRefreshEnd);
    };
  }, []);

  useEffect(() => {
    const normalized = normalizeAvatarUrl(user?.avatarUrl);
    const versionChanged = avatarVersion !== lastVersionRef.current;
    const avatarChanged = normalized !== lastAvatarRef.current;

    if (!versionChanged && !avatarChanged) return;

    lastVersionRef.current = avatarVersion;
    lastAvatarRef.current = normalized;

    if (!normalized) {
      setAvatarSyncing(false);
      setAvatarSrc(AVATAR_FALLBACK_SRC);
      return;
    }

    setAvatarSyncing(true);
    setAvatarSrc(withVersionParam(normalized, avatarVersion));
  }, [user?.avatarUrl, avatarVersion]);

  const handleAvatarLoad = () => setAvatarSyncing(false);
  const handleAvatarLoadError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    setAvatarSyncing(false);
    handleAvatarError(event);
  };

  const handleSearchNavigate = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    nav(`/users/search?q=${encodeURIComponent(trimmed)}`);
    setMobileSearchOpen(false);
    setSearchFocused(false);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    nav("/login", { replace: true });
  };

  const results = searchQuery.data?.users ?? [];
  const totalResults = searchQuery.data?.pagination.total ?? 0;
  const hasMoreResults = totalResults > results.length;

  const showResults = searchFocused && searchEnabled;

  const renderSearchResults = (variant: "desktop" | "mobile") => {
    const containerClasses =
      variant === "desktop"
        ? "absolute left-0 right-0 top-full mt-3 rounded-[28px] border border-white/10 bg-[#08080C]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur"
        : "absolute left-0 right-0 top-full mt-3 rounded-[28px] border border-white/10 bg-[#08080C]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur";

    const listItemClass =
      "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white/[0.08]";

    const content = searchQuery.isLoading ? (
      <p className="px-2 py-3 text-sm text-white/60">Searching…</p>
    ) : searchQuery.isError ? (
      <p className="px-2 py-3 text-sm text-rose-400">Failed to fetch users.</p>
    ) : results.length === 0 ? (
      <div className="flex flex-col items-center gap-1 px-2 py-8 text-center">
        <p className="text-sm font-semibold text-white">No results found</p>
        <p className="text-xs text-white/50">Change your keyword</p>
      </div>
    ) : (
      <ul className="max-h-72 space-y-1 overflow-y-auto pr-1" role="listbox">
        {results.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              className={listItemClass}
              onClick={() => {
                nav(`/profile/${u.username}`);
                setSearchTerm("");
                setSearchFocused(false);
                setMobileSearchOpen(false);
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10">
                <img
                  src={u.avatarUrl || AVATAR_FALLBACK_SRC}
                  alt={u.displayName}
                  className="h-full w-full object-cover"
                  onError={handleAvatarError}
                />
              </span>
              <span className="flex flex-col text-left">
                <span className="text-sm font-semibold text-white">{u.displayName}</span>
                <span className="text-xs text-white/60">@{u.username}</span>
              </span>
            </button>
          </li>
        ))}
        {hasMoreResults && (
          <li>
            <button
              type="button"
              className="mt-1 w-full rounded-2xl border border-violet-500 px-3 py-2 text-center text-sm font-semibold text-violet-400 transition hover:bg-violet-500/10"
              onClick={handleSearchNavigate}
            >
              View all results
            </button>
          </li>
        )}
      </ul>
    );

    return <div className={containerClasses}>{content}</div>;
  };

  const displayName = user?.displayName ?? user?.username ?? "Your profile";

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-none shadow-sm shadow-neutral-900 bg-black/85 backdrop-blur supports-[backdrop-filter]:bg-black/80">
        <div className="container mx-auto flex h-20 items-center gap-4 px-4">
          <div className="flex flex-1 items-center">
            <Link to="/feed" className="flex items-center gap-3 text-white">
              <LogoGlyph className="h-[30px] w-[30px] text-white" />
              <span className="text-lg sm:text-display-xs font-semibold tracking-wide">Sociality</span>
            </Link>
          </div>

          <div
            className="relative hidden flex-1 justify-center md:flex"
            ref={desktopSearchRef}
          >
            <div className="relative w-full max-w-[491px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search"
                className="h-12 w-full rounded-full border border-neutral-900 bg-neutral-950 pl-11 pr-4 text-sm text-white placeholder:text-neutral-600"
              />
              {showResults && renderSearchResults("desktop")}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <button
              type="button"
              className="md:hidden rounded-full border border-white/20 p-2 text-white"
              aria-label="Search"
              onClick={() => {
                setMobileSearchOpen(true);
                setSearchFocused(true);
              }}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* <ThemeToggle /> */}

            <div className="relative hidden md:block" ref={accountMenuRef}>
              <button
                type="button"
                className="flex items-center gap-3 rounded-full  bg-black px-3 py-2 text-white "
                onClick={() => setAccountMenuOpen((prev) => !prev)}
              >
                <span className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full bg-white/20">
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    className={`h-full w-full object-cover transition-opacity duration-150 ${avatarSyncing ? "opacity-0" : "opacity-100"}`}
                    onLoad={handleAvatarLoad}
                    onError={handleAvatarLoadError}
                  />
                  {avatarSyncing && <Skeleton className="absolute inset-0 h-full w-full" />}
                </span>
                <span className="text-md font-semibold">{displayName}</span>
                
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-48 rounded-2xl border border-white/10 bg-black/90 p-2 text-sm text-white/80 shadow-xl backdrop-blur">
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                    onClick={() => {
                      nav("/me");
                      setAccountMenuOpen(false);
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left hover:bg-white/10"
                    onClick={() => {
                      nav("/feed");
                      setAccountMenuOpen(false);
                    }}
                  >
                    Feed
                  </button>
                  <div className="my-2 h-px bg-white/10" />
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-rose-400/10"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="md:hidden rounded-full border border-white/20 p-2 text-white"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-white/10 bg-black/85 px-4 py-4 md:hidden" ref={mobileSearchRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
              <Input
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search"
                className="h-12 rounded-full border border-white/10 bg-white/[0.08] pl-12 pr-12 text-sm text-white placeholder:text-white/40"
              />
              <button
                type="button"
                aria-label="Close search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchFocused(false);
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative mt-3">{showResults && renderSearchResults("mobile")}</div>

          </div>
        )}

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-black/85 px-4 py-4 md:hidden">
            <div className="grid gap-2">
              <Button
                variant="ghost"
                className="justify-start rounded-full bg-white/5 px-6 py-3 text-white hover:bg-white/10"
                onClick={() => {
                  nav("/feed");
                  setMobileMenuOpen(false);
                }}
              >
                Feed
              </Button>
              <Button
                variant="ghost"
                className="justify-start rounded-full bg-white/5 px-6 py-3 text-white hover:bg-white/10"
                onClick={() => {
                  nav("/me");
                  setMobileMenuOpen(false);
                }}
              >
                Profile
              </Button>
              <Button
                variant="outline"
                className="justify-start rounded-full border border-white/20 px-6 py-3 text-white hover:bg-white/10"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
