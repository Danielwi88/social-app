import { getMe } from "@/api/me";
import { searchUsers } from "@/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearAuth, selectAuth, setUser } from "@/features/auth/authSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { LogoGlyph } from "@/shared/logo";
import { useAppDispatch, useAppSelector } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

export function AppLayout() {
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector(selectAuth);
  const fetching = useRef(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const debounced = useDebounce(searchTerm, 350);
  const searchEnabled = debounced.trim().length >= 2;

  const searchQuery = useQuery({
    queryKey: ["app-nav-search", debounced],
    queryFn: () => searchUsers(debounced),
    enabled: searchEnabled,
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

  const showResults = searchFocused && searchEnabled;
  const results = searchQuery.data ?? [];

  const renderSearchResults = (
    <div
      className="absolute left-0 right-0 top-full mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-3 shadow-xl backdrop-blur"
      role="listbox"
    >
      {searchQuery.isLoading ? (
        <p className="text-sm text-white/60">Searching…</p>
      ) : searchQuery.isError ? (
        <p className="text-sm text-rose-400">Failed to fetch users.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-white/60">No users found.</p>
      ) : (
        <ul className="space-y-2">
          {results.slice(0, 5).map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-left text-white/90 hover:bg-white/10"
                onClick={() => {
                  nav(`/profile/${u.username}`);
                  setSearchTerm("");
                  setSearchFocused(false);
                  setMobileSearchOpen(false);
                }}
              >
                <div className="text-sm font-semibold">{u.displayName}</div>
                <div className="text-xs text-white/60">@{u.username}</div>
              </button>
            </li>
          ))}
          {results.length > 5 && (
            <li>
              <button
                type="button"
                className="w-full rounded-xl border border-violet-500 px-3 py-2 text-center text-sm font-semibold text-violet-400 hover:bg-violet-500/10"
                onClick={handleSearchNavigate}
              >
                View all results
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );

  const avatarUrl = user?.avatarUrl || "/avatar-fallback.png";
  const displayName = user?.displayName ?? user?.username ?? "Your profile";

  return (
    <div className="min-h-dvh bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-violet-700/40 bg-black/80 backdrop-blur supports-[backdrop-filter]:bg-black/70">
        <div className="container mx-auto flex h-20 items-center gap-4 px-4">
          <Link to="/feed" className="flex items-center gap-3 text-white">
            <LogoGlyph className="h-10 w-10 text-white" />
            <span className="text-lg font-semibold tracking-wide">Sociality</span>
          </Link>

          <div className="relative hidden flex-1 md:block" ref={desktopSearchRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchNavigate();
                }}
                placeholder="Search"
                className="h-12 rounded-full border border-white/10 bg-white/[0.06] pl-11 pr-4 text-sm text-white placeholder:text-white/40"
              />
            </div>
            {showResults && renderSearchResults}
          </div>

          <div className="ml-auto flex items-center gap-3">
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
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
              >
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20">
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                </span>
                <span className="text-sm font-semibold">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-white/60" />
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchNavigate();
                }}
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
            <div className="relative mt-3">{showResults && renderSearchResults}</div>
            <Button
              className="mt-3 w-full rounded-full bg-violet-500 text-white hover:bg-violet-400"
              onClick={handleSearchNavigate}
            >
              Search
            </Button>
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
