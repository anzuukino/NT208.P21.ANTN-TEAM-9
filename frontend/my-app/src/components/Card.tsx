"use client";

import Image from "next/image";
import { Progress } from "flowbite-react";

interface CardProps {
  title: string;
  description: string;
  image: string;
  progress: number;
  daysLeft: number;
}

const Card = ({
  title,
  text,
  img,
  progress,
  due,
}: {
  title: string;
  text: string;
  img: string;
  progress: string;
  due: string;
}) => {
  // console.assert(typeof text === "string")
  return (
    <div className="max-w-xs w-[35vw] rounded-xl overflow-hidden shadow-lg bg-white border h-[44vh] relative">
      {/* Image */}
      <div 
        className="h-[45%] bg-cover bg-center"
        style={{ backgroundImage: `url('${img}')` }}
      >
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badge */}
        <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
          Funding
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold mt-2 text-gray-900">{title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mt-1">
          {text.length < 30 ? text : text.slice(0, 80) + "..."}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 pt-0 absolute bottom-1 inset-x-0">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{progress}% raised</span>
          <span>{due} days left</span>
        </div>
        <Progress progress={parseInt(progress)} size="sm" className="mt-2" color="blue" />
      </div>
    </div>
  );
};

export default Card;
