// Title component for the app.
// Created by: Kris Tong, Ethan Chen, Emily Kim

import React from "react";

function Title() {
  return (
    <div className="flex justify-center md:m-5 mt-5 mb-16 items-center">
      <h1 className="mr-2 mb-0 text-[4vw] font-bold">Weather Planner</h1>
      <img
        src="/images/logo.png"
        alt="Black and white calendar logo with a rain cloud shown on it"
        className="w-[50px] h-[50px]"
      />
    </div>
  );
}

export default Title;
