'use client';

import React from 'react';

import type { ComponentProps, ReactNode } from 'react';

import { motion } from 'framer-motion';

import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Features', href: '/' },
			{ title: 'Pricing', href: '/pricing' },
			{ title: 'Testimonials', href: '/' },
			{ title: 'Integration', href: '/knowledge' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'FAQs', href: '/' },
			{ title: 'About Us', href: '/' },
			{ title: 'Privacy Policy', href: '/privacy' },
			{ title: 'Terms of Services', href: '/' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '/' },
			{ title: 'Changelog', href: '/' },
			{ title: 'Brand', href: '/' },
			{ title: 'Help', href: '/' },
		],
	},
	{
		label: 'Social Links',
		links: [
			{ title: 'Facebook', href: '#', icon: FacebookIcon },
			{ title: 'Instagram', href: '#', icon: InstagramIcon },
			{ title: 'Youtube', href: '#', icon: YoutubeIcon },
			{ title: 'LinkedIn', href: '#', icon: LinkedinIcon },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<motion.div
					initial={{ filter: 'blur(4px)', y: -8, opacity: 0 }}
					whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
					viewport={{ once: true }}
					transition={{ delay: 0.1, duration: 0.8 }}
					className="space-y-4"
				>
					<img src="/favicon.webp" alt="Resbonder Logo" className="size-16" loading="lazy" width="64" height="64" style={{ aspectRatio: '1 / 1' }} />
					<p className="text-muted-foreground mt-8 text-sm md:mt-0">
						© {new Date().getFullYear()} Resbonder. All rights reserved.
					</p>
				</motion.div>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<motion.div
							key={section.label}
							initial={{ filter: 'blur(4px)', y: -8, opacity: 0 }}
							whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 + index * 0.1, duration: 0.8 }}
						>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs">{section.label}</h3>
								<ul className="text-muted-foreground mt-4 space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-foreground inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-1 size-4" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</footer>
	);
}