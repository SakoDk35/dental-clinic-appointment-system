// src/pages/PlaceholderPage.tsx
// Temporary stand-in for screens not yet built in this incremental build.
// Replaced screen-by-screen as we proceed through the build order.
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <h1 className="h4">{title}</h1>
        <p className="text-helper">This screen hasn&apos;t been built yet in this walkthrough.</p>
      </div>
    </div>
  );
}
