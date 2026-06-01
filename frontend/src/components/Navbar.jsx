import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Logo from "../assets/Logo.png";

function Navbar() {
  const navigate =
    useNavigate();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  // =========================
  // USER
  // =========================
  const user =
    JSON.parse(
      localStorage.getItem(
        "user"
      )
    );

  const isManager =
    user?.role ===
    "manager";

  // =========================
  // LOGOUT
  // =========================
  function logout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate(
      "/login"
    );
  }

  // =========================
  // ACCOUNT LABEL
  // =========================
  function getAccountLabel() {
    if (!user) {
      return "";
    }

    if (
      user.role ===
      "manager"
    ) {
      return "Manager";
    }

    if (
      user.branch &&
      user.branch.name
    ) {
      return user.branch.name;
    }

    return "";
  }

  return (
    <nav
      className="
        print:hidden
        sticky
        top-0
        z-50
        bg-orange-700
        text-white
        shadow-xl
      "
    >

      <div
        className="
          max-w-7xl
          mx-auto
          px-4
        "
      >

        {/* TOP BAR */}
        <div
          className="
            flex
            items-center
            justify-between
            py-4
          "
        >

          {/* LOGO ONLY */}
          <Link
            to="/dashboard"
            className="
              flex
              items-center
            "
          >

            <img
              src={Logo}
              alt="Gadget Shop"
              className="
                h-14
                w-auto
                object-contain
              "
            />

          </Link>

          {/* MOBILE BUTTON */}
          <button
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="
              lg:hidden
              bg-white/10
              hover:bg-white/20
              px-4
              py-2
              rounded-xl
              transition
            "
          >
            ☰
          </button>

          {/* DESKTOP NAV */}
          <div
            className="
              hidden
              lg:flex
              items-center
              gap-4
            "
          >

            {/* DASHBOARD */}
            <Link
              to="/dashboard"
              className="
                px-4
                py-2
                rounded-full
                hover:bg-orange-600
                transition
                font-semibold
              "
            >
              Dashboard
            </Link>

            {/* INVENTORY */}
            <Link
              to="/inventory"
              className="
                px-4
                py-2
                rounded-full
                hover:bg-orange-600
                transition
                font-semibold
              "
            >
              Inventory
            </Link>

            {/* SALES */}
            <div
              className="
                relative
                group
              "
            >

              <button
                className="
                  px-4
                  py-2
                  rounded-full
                  hover:bg-orange-600
                  transition
                  font-semibold
                "
              >
                Sales ▾
              </button>

              <div
                className="
                  absolute
                  left-0
                  top-full
                  pt-2
                  opacity-0
                  invisible
                  group-hover:opacity-100
                  group-hover:visible
                  transition-all
                "
              >

                <div
                  className="
                      bg-orange-800
                      text-white
                      rounded-2xl
                      shadow-2xl
                      overflow-hidden
                      min-w-[240px]
                      border
                      border-orange-600
                    "
                >

                  <Link
                    to="/sales-terminal"
                    className="
                      block
                      px-5
                      py-4
                      hover:bg-orange-700
                    "
                  >
                    Sales Terminal
                  </Link>

                  <Link
                    to="/sales-history"
                    className="
                      block
                      px-5
                      py-4
                      hover:bg-orange-700
                    "
                  >
                    Sales History
                  </Link>

                  <Link
                    to="/returns"
                    className="
                      block
                      px-5
                      py-4
                      hover:bg-orange-700
                    "
                  >
                    Returns
                  </Link>

                </div>

              </div>

            </div>

            {/* TRANSFERS */}
            {isManager && (
              <div
                className="
                  relative
                  group
                "
              >

                <button
                  className="
                    px-4
                    py-2
                    rounded-full
                    hover:bg-orange-600
                    transition
                    font-semibold
                  "
                >
                  Transfers ▾
                </button>

                <div
                  className="
                    absolute
                    left-0
                    top-full
                    pt-2
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                  "
                >
                  <div
                    className="
                      bg-orange-800
                      text-white
                      rounded-2xl
                      shadow-2xl
                      overflow-hidden
                      min-w-[240px]
                      border
                      border-orange-600
                    ">
                  
                    <Link
                      to="/transfers"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Transfer Phones
                    </Link>

                    <Link
                      to="/transfer-history"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Transfer History
                    </Link>

                  </div>

                </div>

              </div>
            )}
                        {/* REPORTS */}
            <Link
              to="/reports"
              className="
                px-4
                py-2
                rounded-full
                hover:bg-orange-600
                transition
                font-semibold
              "
            >
              Reports
            </Link>

            {/* MANAGE */}
            {isManager && (
              <div
                className="
                  relative
                  group
                "
              >

                <button
                  className="
                    px-4
                    py-2
                    rounded-full
                    hover:bg-orange-600
                    transition
                    font-semibold
                  "
                >
                  Manage ▾
                </button>

                <div
                  className="
                    absolute
                    right-0
                    top-full
                    pt-2
                    opacity-0
                    invisible
                    group-hover:opacity-100
                    group-hover:visible
                    transition-all
                  "
                >

                  <div
                    className="
                      bg-orange-800
                      text-white
                      rounded-2xl
                      shadow-2xl
                      overflow-hidden
                      min-w-[240px]
                      border
                      border-orange-600
                    "
                  >

                    <Link
                      to="/add-phone"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Add Phone
                    </Link>

                    <Link
                      to="/branches"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Branches
                    </Link>

                    <Link
                      to="/users"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Users
                    </Link>

                    <Link
                      to="/audit-logs"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Audit Logs
                    </Link>

                  </div>

                </div>

              </div>
            )}

            {/* USER */}
            <div
              className="
                bg-white/10
                border
                border-white/20
                rounded-2xl
                px-5
                py-2.5
                shadow-md
              "
            >

              <div className="text-right">

                <p
                  className="
                    text-sm
                    font-bold
                    leading-none
                  "
                >
                  {user?.username}
                </p>

                <p
                  className="
                    text-xs
                    text-orange-100
                    mt-1
                  "
                >
                  {getAccountLabel()}
                </p>

              </div>

            </div>

            {/* LOGOUT */}
            <button
              onClick={
                logout
              }
              className="
                bg-white
                text-orange-700
                hover:bg-orange-700
                px-5
                py-2
                rounded-2xl
                font-bold
                transition
                shadow-lg
              "
            >
              Logout
            </button>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (

          <div
            className="
              lg:hidden
              pb-4
            "
          >

            <div
              className="
                bg-white
                text-gray-800
                rounded-3xl
                shadow-2xl
                overflow-hidden
              "
            >

              <Link
                to="/dashboard"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Dashboard
              </Link>

              <Link
                to="/inventory"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Inventory
              </Link>

              <div
                className="
                  px-5
                  py-3
                  bg-orange-50
                  font-bold
                  text-orange-700
                "
              >
                SALES
              </div>

              <Link
                to="/sales-terminal"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Sales Terminal
              </Link>

              <Link
                to="/sales-history"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Sales History
              </Link>

              <Link
                to="/returns"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Returns
              </Link>

              {isManager && (
                <>
                  <div
                    className="
                      px-5
                      py-3
                      bg-orange-50
                      font-bold
                      text-orange-700
                    "
                  >
                    TRANSFERS
                  </div>

                  <Link
                    to="/transfers"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Transfer Phones
                  </Link>

                  <Link
                    to="/transfer-history"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Transfer History
                  </Link>

                  <div
                    className="
                      px-5
                      py-3
                      bg-orange-50
                      font-bold
                      text-orange-700
                    "
                  >
                    MANAGE
                  </div>

                  <Link
                    to="/add-phone"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Add Phone
                  </Link>

                  <Link
                    to="/branches"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Branches
                  </Link>

                  <Link
                    to="/users"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Users
                  </Link>

                  <Link
                    to="/audit-logs"
                    className="
                      block
                      px-5
                      py-4
                      border-b
                    "
                  >
                    Audit Logs
                  </Link>
                </>
              )}

              <Link
                to="/reports"
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Reports
              </Link>

              <div
                className="
                  px-5
                  py-4
                  bg-orange-50
                  border-b
                "
              >

                <p className="font-bold">
                  {user?.username}
                </p>

                <p className="text-sm text-gray-500">
                  {getAccountLabel()}
                </p>

              </div>

              <button
                onClick={
                  logout
                }
                className="
                  w-full
                  text-left
                  px-5
                  py-4
                  bg-red-50
                  text-red-700
                  font-semibold
                "
              >
                Logout
              </button>

            </div>

          </div>

        )}

      </div>

    </nav>
  );
}

export default Navbar;