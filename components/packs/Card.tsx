import React from "react";

type Props = {
  children?: React.ReactNode;
};

const Card = ({ children }: Props) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 shadow-md rounded-lg p-6">{children}</div>
  )
};

export default Card;
