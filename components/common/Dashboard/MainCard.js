"use client";
import Card from "../Card";
import Button from "../Button";
import { useRouter } from "next/navigation";

export default function MainCard({ profile, user }) {
  const router = useRouter();
  const handleFunction = () => {
    router.push("/dashboard/FlightChecker");
  };
  const handleResgisterCompanion = () => {
    router.push("/auth/login?role=companion&type=signup");
  };

  return (
    <section className="">
      <Card
        className=" 
        bg-white border-[0.5px] h-[500px]  border-[#0000001A] rounded-[14.01px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-8 w-full hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow duration-300
        relative
        "
      >
        {/* <div className="overlay absolute inset-0 bg-black opacity-20 rounded-md z-30"></div> */}
        <img
          src="/images/3.jpg"
          alt="Main Card Image"
          className="w-full absolute top-0 left-0 h-full  z-20 rounded-md"
        />
        <div className="relative  flex flex-col justify-center items-center h-full  z-50 w-[50%] mr-auto">
          <div className="bg-black/40 p-4 rounded-md w-full h-auto flex flex-col justify-strat items-start">
            <h2 className="text-xl lg:text-3xl md:text-2xl max-w-xs font-semibold mb-4 lg:mb-6 text-white">
              Together every flight feels better
            </h2>
            <div className="flex gap-3 mt-2">
              <Button
                onClick={handleFunction}
                className="text-xs font-medium bg-blue-500 px-3 !md:px-5 py-1.5 !md:py-3 text-white"
              >
                Find Assistance
              </Button>

              {profile === null && user === null && (
                <div className="">
                  <Button
                    onClick={handleResgisterCompanion}
                    className="text-xs font-medium bg-blue-500 px-3 !md:px-5 py-1.5 !md:py-3 text-white"
                  >
                    Become a Companion
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
