import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { PlusIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from '@/components/ui/accordion';

const items = [
  {
    id: '1',
    title: 'What is Marlin Protocol?',
    content:
      'Marlin is a revolutionary DeFi protocol built on Algorand that enables yield tokenization. It splits yield-bearing assets into Principal Tokens (PT) and Yield Tokens (YT), allowing users to trade future yield, create fixed-rate positions, and unlock new capital-efficient strategies in the DeFi ecosystem.',
  },
  {
    id: '2',
    title: 'How does yield tokenization work?',
    content:
      'When you deposit a yield-bearing asset into Marlin, it gets split into two components: Principal Tokens (PT) representing the underlying asset value, and Yield Tokens (YT) representing the future yield. This separation allows you to trade, hedge, or speculate on yield independently from the principal.',
  },
  {
    id: '3',
    title: 'What are the benefits of using Marlin?',
    content:
      "Marlin offers multiple advantages: fixed-rate lending and borrowing, yield speculation and hedging, capital-efficient strategies, automated risk management through AI-powered converters, secure price oracles, and seamless trading on our integrated AMM with competitive liquidity rewards.",
  },
  {
    id: '4',
    title: 'Is Marlin Protocol secure?',
    content:
      'Yes, Marlin prioritizes security with multiple layers of protection: smart contracts audited for vulnerabilities, tamper-resistant price oracles with built-in validation, emergency circuit breakers, decentralized validation mechanisms, and an AI-powered risk management system that monitors and protects your assets 24/7.',
  },
  {
    id: '5',
    title: 'How do I get started with Marlin?',
    content:
      "Getting started is simple: Connect your Algorand wallet, deposit supported yield-bearing tokens (like stALGO, gALGO, or xALGO), choose to tokenize your yield, and start trading PT/YT tokens or providing liquidity to earn rewards. Our dashboard provides an intuitive interface for all operations.",
  },
  {
    id: '6',
    title: 'What tokens does Marlin support?',
    content:
      'Marlin supports various Algorand-based yield-bearing tokens including stALGO, gALGO, xALGO, and over 12 other assets. Our Standardized Wrapper converts these into unified SY tokens, making them interoperable across the entire Marlin ecosystem with just a 0.1% conversion fee.',
  },
];

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
      duration: 0.4,
    },
  }),
};

export default function Faq1() {
  return (
    <section className="py-12 md:py-16 bg-transparent">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <motion.h2
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-black"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions{' '}
            
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Everything you need to know about Marlin Protocol and how to maximize your DeFi yield strategies on Algorand.
          </motion.p>
        </div>

        <motion.div
          className="relative mx-auto max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Decorative gradient */}
          <div className="bg-primary/10 absolute -top-4 -left-4 -z-10 h-72 w-72 rounded-full blur-3xl" />
          <div className="bg-primary/10 absolute -right-4 -bottom-4 -z-10 h-72 w-72 rounded-full blur-3xl" />

          <Accordion
            type="single"
            collapsible
            className="border-white/20 bg-white/10 w-full rounded-xl border p-2 backdrop-blur-md"
            defaultValue="1"
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                custom={index}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={item.id}
                  className={cn(
                    'bg-white/5 my-1 overflow-hidden rounded-lg border-none px-2 shadow-sm transition-all',
                    'data-[state=open]:bg-white/15 data-[state=open]:shadow-md',
                  )}
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        'group flex flex-1 items-center justify-between gap-4 py-4 text-left text-base font-medium text-black',
                        'hover:text-gray-700 transition-all duration-300 outline-none',
                        'focus-visible:ring-blue-400/50 focus-visible:ring-2',
                        'data-[state=open]:text-gray-700',
                      )}
                    >
                      {item.title}
                      <PlusIcon
                        size={18}
                        className={cn(
                          'text-gray-600 shrink-0 transition-transform duration-300 ease-out',
                          'group-data-[state=open]:rotate-45',
                        )}
                        aria-hidden="true"
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionContent
                    className={cn(
                      'text-gray-800 overflow-hidden pt-0 pb-4',
                      'data-[state=open]:animate-accordion-down',
                      'data-[state=closed]:animate-accordion-up',
                    )}
                  >
                    <div className="border-border/30 border-t pt-3">
                      {item.content}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
