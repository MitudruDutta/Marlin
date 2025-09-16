import { Marquee } from "@/components/ui/marquee"
import Image from "next/image"

const companies = [
  {
    name: "Algorand",
    url: "/images/algorand.png",
  },
  {
    name: "RiseIn",
    url: "/images/risein.png",
  },
  {
    name: "HackQuest",
    url: "/images/hackquest.png",
  }
]

export function Logos() {
  return (
    <section id="logos">
      <div className="container mx-auto px-4 py-12 md:px-8">
        <h3 className="text-center text-sm font-semibold text-black/70">TRUSTED BY LEADING COMMUNITIES</h3>
        <div className="relative mt-6">
          <Marquee className="max-w-full [--duration:40s]">
            {companies.map((company, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center mx-6 min-w-[112px] min-h-[40px] h-12 w-32"
                style={{ aspectRatio: 'auto 112 / 40' }}
              >
                <Image
                  width={112}
                  height={40}
                  src={company.url || "/placeholder.svg"}
                  className="object-contain max-h-10 max-w-[112px] opacity-30 grayscale dark:brightness-0 dark:invert"
                  alt={company.name}
                />
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}