import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div>
      <header>
        <h1>My Website</h1>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <p>&copy; 2025 My Website</p>
      </footer>
    </div>
  );
};

export default MainLayout;
