import * as React from "react";

const SvgRussia = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 480"
    width="24"
    height="24"
    className=""
    fill="currentColor"
    {...props}
  >
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#fff" d="M0 0h640v480H0z" />
      <path fill="#0039a6" d="M0 160h640v320H0z" />
      <path fill="#d52b1e" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

export default SvgRussia;
