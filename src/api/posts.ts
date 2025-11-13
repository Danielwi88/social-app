import { api } from "../lib/axios";
import { compressImageFile } from "../lib/image";
import type { Post, Comment, FeedPage, CommentsPage, UserMini } from "../types/post";

type FeedPagination = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

type FeedResponseRaw = {
  items?: FeedPostRaw[];
  data?: {
    items?: FeedPostRaw[];
    pagination?: FeedPagination;
  };
  pagination?: FeedPagination;
  nextCursor?: string | null;
};

type FeedPostRaw = {
  id?: number | string;
  imageUrl?: string | null;
  caption?: string | null;
  createdAt?: string | null;
  author?: {
    id?: number | string;
    username?: string | null;
    name?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  likeCount?: number | null;
  commentCount?: number | null;
  saved?: unknown;
  savedByMe?: unknown;
  isSaved?: unknown;
  bookmarked?: unknown;
  liked?: boolean | null;
  likedByMe?: boolean | null;
  isLiked?: boolean | null;
  isLikedByMe?: boolean | null;
  liked_by_me?: unknown;
  liked_byMe?: unknown;
  liked_by_current_user?: unknown;
};

const resolveSavedFlag = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  return undefined;
};
// Handle multiple possible field names from backend
const mapPost = (item: FeedPostRaw): Post => {
  const authorRaw = item.author ?? {};
  const author: UserMini = {
    id: authorRaw?.id !== undefined && authorRaw?.id !== null ? String(authorRaw.id) : "",
    username: authorRaw?.username?.trim() || "",
    displayName: authorRaw?.displayName ?? authorRaw?.name ?? authorRaw?.username ?? null,
    name: authorRaw?.name ?? null,
    avatarUrl: authorRaw?.avatarUrl ?? null,
  };

  const savedResolved =
    resolveSavedFlag(item.saved) ??
    resolveSavedFlag((item as FeedPostRaw & { saved_post?: unknown }).saved_post) ??
    resolveSavedFlag(item.savedByMe) ??
    resolveSavedFlag(item.isSaved) ??
    resolveSavedFlag(item.bookmarked);

  const likedResolved = resolveSavedFlag(
    item.liked ??
      item.likedByMe ??
      item.isLiked ?? // ... multiple variants
      item.isLikedByMe ??
      (item as { liked_by_me?: unknown }).liked_by_me ??
      (item as { liked_byMe?: unknown }).liked_byMe ??
      (item as { liked_by_current_user?: unknown }).liked_by_current_user
  );

  return {
    id: item.id !== undefined && item.id !== null ? String(item.id) : "",
    imageUrl: item.imageUrl ?? "",
    caption: item.caption ?? "",
    createdAt: item.createdAt ?? new Date().toISOString(),
    author,
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    saved: savedResolved,
    liked: likedResolved,
  };
};
// Convert cursor to page number
export async function getFeed(cursor?: string, limit = 12) {
  let page = 1;
  if (cursor) {
    const parsed = Number(cursor);
    if (Number.isFinite(parsed) && parsed > 0) page = Math.floor(parsed);
  }
// Handle multiple response formats from backend
  const { data } = await api.get("/feed", { params: { page, limit } });
  const payload = data as FeedResponseRaw;

  const rawItems = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.data?.items)
      ? payload.data.items
      : [];

  const items: Post[] = rawItems.map((item) => mapPost(item));

  const rawNextCursor =
    typeof payload.nextCursor === "string" && payload.nextCursor.trim() !== ""
      ? payload.nextCursor
      : undefined;

  const pagination = payload.pagination ?? payload.data?.pagination;
  const resolvedLimit = pagination?.limit ?? limit;
  const nextPage =
    pagination?.page && pagination?.totalPages && pagination.page < pagination.totalPages
      ? String(pagination.page + 1)
      : undefined;

  const nextCursor = rawNextCursor ?? nextPage ?? (items.length === resolvedLimit ? String(page + 1) : undefined);

  const pageResult: FeedPage = { items, nextCursor };
  return pageResult;
}

export async function getPost(id: string) {
  const { data } = await api.get(`/posts/${id}`);
  return mapPost((data as FeedPostRaw) ?? {});
}

type LikeResponseRaw = {
  liked?: unknown;
  likeCount?: unknown;
  data?: {
    liked?: unknown;
    likeCount?: unknown;
  } | null;
};

const normalizeLikeResponse = (payload: LikeResponseRaw | undefined) => {
  const source = payload?.data ?? payload ?? {};
  const liked = resolveSavedFlag(source.liked);
  const countRaw = source.likeCount;
  const likeCount =
    typeof countRaw === "number" && Number.isFinite(countRaw)
      ? countRaw
      : typeof countRaw === "string" && countRaw.trim() !== ""
        ? Number(countRaw)
        : undefined;
  return { liked, likeCount } as { liked?: boolean; likeCount?: number };
};

export async function likePost(id: string) {
  const { data } = await api.post(`/posts/${id}/like`);
  return normalizeLikeResponse(data as LikeResponseRaw | undefined);
}

export async function unlikePost(id: string) {
  const { data } = await api.delete(`/posts/${id}/like`);
  return normalizeLikeResponse(data as LikeResponseRaw | undefined);
}

export async function savePost(id: string) {
  const { data } = await api.post(`/posts/${id}/save`);
  return data as { saved?: boolean };
}

export async function unsavePost(id: string) {
  const { data } = await api.delete(`/posts/${id}/save`);
  return data as { saved?: boolean };
}

export async function createPost(payload: { image: File; caption?: string }) {
  const formData = new FormData();
  const optimizedImage = await compressImageFile(payload.image, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1400,
  });
  formData.append("image", optimizedImage);
  if (payload.caption) formData.append("caption", payload.caption);

  const { data } = await api.post(`/posts`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as Post;
}

export async function deletePost(id: string) {
  const { data } = await api.delete(`/posts/${id}`);
  return data as { ok: true };
}

type CommentsNestedRaw = {
  comments?: CommentRaw[];
  items?: CommentRaw[];
  pagination?: CommentsPaginationRaw;
  nextCursor?: string | null;
};

type CommentsEnvelopeRaw = CommentsNestedRaw & {
  data?: CommentsNestedRaw | null;
  success?: boolean;
  message?: string;
};

type CommentRaw = {
  id?: number | string;
  postId?: number | string;
  body?: string | null;
  comment?: string | null;
  content?: string | null;
  text?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  author?: UserMiniRaw | null;
  user?: UserMiniRaw | null;
};

type CommentsPaginationRaw = {
  page?: number | null;
  limit?: number | null;
  totalPages?: number | null;
};

type UserMiniRaw = {
  id?: number | string | null;
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
};

export async function getComments(postId: string, cursor?: string, limit = 10) {
  let page = 1;
  if (cursor) {
    const parsed = Number(cursor);
    if (Number.isFinite(parsed) && parsed > 0) page = Math.floor(parsed);
  }

  const { data } = await api.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });

  const payload = (data as CommentsEnvelopeRaw) ?? {};
  const nested = payload.data ?? null;

  const candidates: CommentRaw[] = [
    nested?.comments,
    nested?.items,
    payload.comments,
    payload.items,
  ].flatMap((arr) => (Array.isArray(arr) ? arr : []));

  const parseAuthor = (author?: UserMiniRaw | null): UserMini => {
    const base = author ?? {};
    return {
      id: base?.id !== undefined && base?.id !== null ? String(base.id) : "",
      username: base?.username?.trim() || "",
      displayName: base?.displayName ?? base?.name ?? base?.username ?? null,
      name: base?.name ?? null,
      avatarUrl: base?.avatarUrl ?? base?.avatar ?? null,
    };
  };

  const items: Comment[] = candidates.map((item: CommentRaw) => {
    const body = item?.body ?? item?.comment ?? item?.content ?? item?.text ?? "";
    const authorRaw = (item?.author as UserMiniRaw | null | undefined) ?? (item?.user as UserMiniRaw | null | undefined);
    const resolvedId =
      item?.id !== undefined && item?.id !== null
        ? String(item.id)
        : typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `temp-${Date.now()}`;
    return {
      id: resolvedId,
      postId: item?.postId !== undefined && item?.postId !== null ? String(item.postId) : postId,
      body,
      author: parseAuthor(authorRaw),
      createdAt: item?.createdAt ?? item?.updatedAt ?? new Date().toISOString(),
    };
  });

  const pagination = nested?.pagination ?? payload.pagination;
  const nextPage =
    pagination?.page && pagination?.totalPages && pagination.page < pagination.totalPages
      ? String(pagination.page + 1)
      : undefined;

  const rawNextCursor = (nested?.nextCursor ?? payload.nextCursor)?.trim();
  const nextCursor = rawNextCursor ? rawNextCursor : nextPage;

  const pageResult: CommentsPage = { items, nextCursor };
  return pageResult;
}

export async function addComment(postId: string, body: string) {
  const payload = {
    body,
    text: body,
    comment: body,
  };

  const { data } = await api.post(`/posts/${postId}/comments`, payload);
  return data as Comment;
}

export async function deleteComment(id: string) {
  const { data } = await api.delete(`/comments/${id}`);
  return data as { ok: true };
}
