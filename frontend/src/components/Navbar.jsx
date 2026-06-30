import {
useEffect,
useRef,
useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Logo from "../assets/Logo.png";

function Navbar() {
const navigate =
useNavigate();

const location =
useLocation();

const [
mobileMenuOpen,
setMobileMenuOpen,
] = useState(false);

const [
moreMenuOpen,
setMoreMenuOpen,
] = useState(false);

const [
salesMenuOpen,
setSalesMenuOpen,
] = useState(false);

const moreMenuRef =
useRef(null);

const salesMenuRef =
useRef(null);

const user =
JSON.parse(
  localStorage.getItem(
    "user"
  ) || "null"
);

const isManager =
user?.role ===
"manager";

useEffect(() => {
function handleClickOutside(
event
) {
if (
moreMenuRef.current &&
!moreMenuRef.current.contains(
event.target
)
) {
setMoreMenuOpen(
false
);
}

  if (
    salesMenuRef.current &&
    !salesMenuRef.current.contains(
      event.target
    )
  ) {
    setSalesMenuOpen(
      false
    );
  }
}

document.addEventListener(
  "mousedown",
  handleClickOutside
);

return () =>
  document.removeEventListener(
    "mousedown",
    handleClickOutside
  );

}, []);

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

const salesActive =
  location.pathname ===
    "/sales-terminal" ||
  location.pathname ===
    "/sales-history" ||
  location.pathname ===
    "/returns";

const navClass = ({
  isActive,
}) =>
  `px-4 py-2 rounded-full transition font-semibold ${
    isActive
      ? "bg-white text-orange-700"
      : "hover:bg-orange-600"
  }`;

return ( <nav
   className="
     print:hidden
     sticky
     top-0
     z-50
     bg-orange-700
     text-white
     shadow-xl
   "
 > <div
     className="
       max-w-7xl
       mx-auto
       px-4
     "
   > <div
       className="
         flex
         items-center
         justify-between
         py-4
       "
     > <Link
         to="/dashboard"
         className="
           flex
           items-center
         "
       > <img
           src={Logo}
           alt="Gadget Shop"
           className="
             h-14
             w-auto
             object-contain
           "
         /> </Link>
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

      <div
        className="
          hidden
          lg:flex
          items-center
          gap-3
        "
      >
        <NavLink
          to="/dashboard"
          className={
            navClass
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/inventory"
          className={
            navClass
          }
        >
          Inventory
        </NavLink>

        <NavLink
          to="/stock-lookup"
          className={
            navClass
          }
        >
          Stock Lookup
        </NavLink>
        <div
          ref={salesMenuRef}
          className="
            relative
          "
        >
          <button
  onClick={() =>
    setSalesMenuOpen(
      !salesMenuOpen
    )
  }
  className={`
    px-4
    py-2
    rounded-full
    transition
    font-semibold
    ${
      salesActive
        ? "bg-white text-orange-700"
        : "hover:bg-orange-600"
    }
  `}
>
  Sales ▾
</button>

          {salesMenuOpen && (
            <div
              className="
                absolute
                left-0
                top-full
                pt-2
                z-50
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
          )}
        </div>

        <NavLink
                  to="/reports"
                  className={
                    navClass
                  }
                >
                  Reports
                </NavLink>

                <NavLink
                  to="/audit-logs"
                  className={
                    navClass
                  }
                >
                  Audit Logs
                </NavLink>

                {isManager && (
            <Link
              to="/add-phone"
            className="
              px-4
              py-2
              rounded-full
              hover:bg-orange-600
              transition
              font-semibold
            "
          >
            Add Phone
          </Link>
        )}

        {isManager && (
          <div
            ref={moreMenuRef}
            className="
              relative
            "
          >
            <button
              onClick={() =>
                setMoreMenuOpen(
                  !moreMenuOpen
                )
              }
              className="
                px-4
                py-2
                rounded-full
                hover:bg-orange-600
                transition
                font-semibold
              "
            >
              More ▾
            </button>

            {moreMenuOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  pt-2
                  z-50
                "
              >
                <div
                  className="
                    bg-orange-800
                    text-white
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                    min-w-[260px]
                    border
                    border-orange-600
                  "
                >
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

                  <Link
                      to="/bulk-inventory-update"
                      className="
                        block
                        px-5
                        py-4
                        hover:bg-orange-700
                      "
                    >
                      Bulk Inventory Update
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

                </div>
              </div>
            )}
          </div>
        )}

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

        <button
          onClick={
            logout
          }
          className="
            bg-white
            text-orange-700
            hover:bg-orange-100
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
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
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
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="
              block
              px-5
              py-4
              border-b
            "
          >
            Inventory
          </Link>

          <Link
            to="/stock-lookup"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="
              block
              px-5
              py-4
              border-b
            "
          >
            Stock Lookup
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
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
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
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
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
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="
              block
              px-5
              py-4
              border-b
            "
          >
            Returns
          </Link>

          <Link
            to="/reports"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            className="
              block
              px-5
              py-4
              border-b
            "
          >
            Reports
          </Link>

          <Link
            to="/audit-logs"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="
              block
              px-5
              py-4
              border-b
            "
          >
            Audit Logs
          </Link>
          {isManager && (
            <>
              <Link
                to="/add-phone"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Add Phone
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
                MORE
              </div>

              <Link
                to="/transfers"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
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
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Transfer History
              </Link>

              <Link
                  to="/bulk-inventory-update"
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className="
                    block
                    px-5
                    py-4
                    border-b
                  "
                >
                  Bulk Inventory Update
                </Link>

              <Link
                to="/branches"
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
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
                onClick={() =>
                  setMobileMenuOpen(
                    false
                  )
                }
                className="
                  block
                  px-5
                  py-4
                  border-b
                "
              >
                Users
              </Link>
            </>
          )}

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
