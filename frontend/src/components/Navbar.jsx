import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-black text-white px-6 py-4 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-xl font-bold">
          Phone Inventory
        </h1>

        <div className="flex gap-4">
          <Link
            to="/"
            className="transition hover:text-gray-300"
          >
            Phones
          </Link>

          <Link
            to="/add"
            className="transition hover:text-gray-300"
          >
            Add Phone
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;