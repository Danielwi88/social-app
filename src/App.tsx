import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { AppRouter } from "@/routes/app-router";

export default function App() {
  return (
    <>
      <AppRouter />
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </>
  );
}
