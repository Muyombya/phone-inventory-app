import { useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";

function Login() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================
  // LOGIN
  // =========================
  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const { data } =
        await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            username,
            password,
          }
        );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(
          data.user
        )
      );

      window.location.href =
        "/dashboard";
    } catch (err) {
      console.log(err);

      setError(
        err.response?.data
          ?.message ||
          "Invalid username or password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-br
        from-orange-700
        via-orange-600
        to-orange-500
        flex
        items-center
        justify-center
        p-6
      "
    >

      {/* DECORATION */}
      <div
        className="
          absolute
          top-[-120px]
          left-[-120px]
          w-72
          h-72
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      <div
        className="
          absolute
          bottom-[-120px]
          right-[-120px]
          w-80
          h-80
          rounded-full
          bg-white/10
          blur-3xl
        "
      />

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          w-full
          max-w-6xl
        "
      >

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            gap-6
            items-center
          "
        >

          {/* ========================= */}
          {/* BRAND CARD */}
          {/* ========================= */}
          <div
            className="
              backdrop-blur-xl
              bg-white/10
              border
              border-white/20
              rounded-3xl
              shadow-2xl
              p-10
              text-white
            "
          >

            <div className="text-center">

              <img
                src={logo}
                alt="Gadget Shop"
                className="
                  w-40
                  mx-auto
                  drop-shadow-2xl
                "
              />

              <h1
                className="
                  text-5xl
                  font-black
                  mt-6
                "
              >
                Gadget Shop
              </h1>

              <p
                className="
                  mt-5
                  text-xl
                  text-orange-100
                  leading-relaxed
                  max-w-md
                  mx-auto
                "
              >
                Manage inventory,
                sales and branch
                operations from
                one place.
              </p>

              <div
                className="
                  mt-10
                  border-t
                  border-white/20
                  pt-8
                "
              >

                <p
                  className="
                    text-orange-100
                    text-lg
                    leading-relaxed
                  "
                >
                  Phones &
                  Accessories
                  Management
                  Platform
                </p>

              </div>

            </div>

          </div>

          {/* ========================= */}
          {/* LOGIN CARD */}
          {/* ========================= */}
          <div
            className="
              backdrop-blur-xl
              bg-white/15
              border
              border-white/20
              rounded-3xl
              shadow-2xl
              p-8
              md:p-10
            "
          >

            <div className="mb-8">

              <h2
                className="
                  text-4xl
                  font-black
                  text-white
                "
              >
                Welcome Back
              </h2>

              <p
                className="
                  text-orange-100
                  mt-3
                "
              >
                Sign in to continue
              </p>

            </div>

            {/* ERROR */}
            {error && (
              <div
                className="
                  bg-red-500/20
                  border
                  border-red-300/30
                  text-white
                  rounded-2xl
                  p-4
                  mb-6
                "
              >
                {error}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={
                handleSubmit
              }
              className="
                space-y-5
              "
            >
                            {/* USERNAME */}
              <div>

                <label
                  className="
                    block
                    mb-2
                    text-white
                    font-semibold
                  "
                >
                  Username
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value
                    )
                  }
                  placeholder="Enter username"
                  required
                  className="
                    w-full
                    rounded-2xl
                    px-4
                    py-3
                    bg-white/90
                    border
                    border-white/30
                    focus:outline-none
                    focus:ring-4
                    focus:ring-orange-300
                  "
                />

              </div>

              {/* PASSWORD */}
              <div>

                <label
                  className="
                    block
                    mb-2
                    text-white
                    font-semibold
                  "
                >
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter password"
                  required
                  className="
                    w-full
                    rounded-2xl
                    px-4
                    py-3
                    bg-white/90
                    border
                    border-white/30
                    focus:outline-none
                    focus:ring-4
                    focus:ring-orange-300
                  "
                />

              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  bg-white
                  text-orange-700
                  py-3
                  rounded-2xl
                  font-bold
                  text-lg
                  shadow-xl
                  hover:bg-orange-50
                  transition-all
                  duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {loading
                  ? "Logging in..."
                  : "Login"}
              </button>

            </form>

          </div>

        </div>

        {/* FOOTER */}
        <div
          className="
            text-center
            mt-8
            text-orange-100
            text-sm
          "
        >
          Gadget Shop © 2026
        </div>

      </div>

    </div>
  );
}

export default Login;