import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../shared/protected-route';
import { AppLayout } from '../layouts/Navbar';
import { SpinnerPage } from '../shared/spinner-page';

const Login = lazy(() => import('../pages/auth/login'));
const Register = lazy(() => import('../pages/auth/register'));
const Feed = lazy(() => import('../pages/feed/feed'));
const Me = lazy(() => import('../pages/me/me'));
const EditProfile = lazy(() => import('@/pages/me/edit-profile'));
const PostDetail = lazy(() => import('@/pages/post/post-detail'));
const AddPost = lazy(() => import('@/pages/post/add-post'));

const PublicProfile = lazy(() => import('@/pages/profile/public-profile'));
const SearchUsers = lazy(() => import('@/pages/users/search-users'));
const MyFollowers = lazy(() => import('@/pages/me/followers'));
const MyFollowing = lazy(() => import('@/pages/me/following'));

const PublicFollowers = lazy(() => import('@/pages/profile/followers'));
const PublicFollowing = lazy(() => import('@/pages/profile/following'));

export function AppRouter() {
  return (
    <Suspense fallback={<SpinnerPage />}>
      <Routes>
        {/* Public */}
          <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/users/search' element={<SearchUsers />} />
        <Route path='/users/:username/followers' element={<PublicFollowers />} />
        <Route path='/users/:username/following' element={<PublicFollowing />} />

        {/* Private */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path='/feed' element={<Feed />} />
          <Route path='/posts/new' element={<AddPost />} />
          <Route path='/me' element={<Me />} />
          <Route path='/me/edit' element={<EditProfile />} />
          <Route path='/me/followers' element={<MyFollowers />} />
          <Route path='/me/following' element={<MyFollowing />} />
          <Route path='/posts/:id' element={<PostDetail />} />
          <Route path='/profile/:username' element={<PublicProfile />} />
        </Route>

        {/* Default */}
        <Route path='/' element={<Navigate to='/feed' replace />} />
        <Route path='*' element={<Navigate to='/feed' replace />} />
      </Routes>
    </Suspense>
  );
}
