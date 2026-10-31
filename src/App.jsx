import { Link, Route, Routes } from "react-router-dom";

function HomePage() {
  return (
    <main className="page">
      <header className="topbar">
        <Link className="brand" to="/">
          CivicConnect
        </Link>
      </header>

      <section className="welcome">
        <p className="eyebrow">Your community, connected</p>
        <h1>A better way to make your voice heard.</h1>
        <p className="intro">
          CivicConnect is getting ready to make it easier for residents to
          connect with their local community.
        </p>
      </section>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page">
      <section className="welcome">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <Link className="home-link" to="/">
          Return home
        </Link>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
