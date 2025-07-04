import React from 'react';
// Loader component
const Loader = () => {
  return (
    <>
      {/*
        Inline style tag for the loader's custom CSS and keyframes.
        This ensures the CSS is scoped to this component if used in a larger app,
        or simply included for this standalone example.
      */}
      <style>
        {`
        /* Custom CSS for the loader animation */
        .loader {
            --r1: 154%;
            --r2: 68.5%;
            width: 60px;
            aspect-ratio: 1;
            border-radius: 50%;
            background:
                radial-gradient(var(--r1) var(--r2) at top ,#0000 79.5%,#269af2 80%),
                radial-gradient(var(--r1) var(--r2) at bottom,#269af2 79.5%,#0000 80%),
                radial-gradient(var(--r1) var(--r2) at top ,#0000 79.5%,#269af2 80%),
                #ccc;
            background-size: 50.5% 220%;
            background-position: -100% 0%,0% 0%,100% 0%;
            background-repeat: no-repeat;
            animation: l9 2s infinite linear;
        }

        /* Keyframes for the loader animation */
        @keyframes l9 {
            33% {
                background-position: 0% 33%, 100% 33%, 200% 33%;
            }
            66% {
                background-position: -100% 66%, 0% 66%, 100% 66%;
            }
            100% {
                background-position: 0% 100%, 100% 100%, 200% 100%;
            }
        }
        `}
      </style>
      {/* The loader element */}
      <div className="loader"></div>
    </>
  );
};

export default Loader;