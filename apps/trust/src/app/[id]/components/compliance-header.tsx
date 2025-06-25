'use client';

import type { Organization } from '@comp/db/types';
import { buttonVariants } from '@comp/ui/button';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ComplianceSummary from './compliance-summary';

interface ComplianceHeaderProps {
  organization: Organization;
  title: string;
}

const hasLogo = process.env.LOGO_DEV === 'true';

export default function ComplianceHeader({ organization, title }: ComplianceHeaderProps) {
  return (
    <div className="border-t-primary flex flex-col gap-4 rounded-sm border border-t-4 p-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center">
            {organization.website ? (
              <Image
                src={
                  organization.logo ||
                  (hasLogo
                    ? `https://img.logo.dev/${organization.website.replace('https://', '')}?token=${process.env.LOGO_DEV}&retina=true&format=png`
                    : `https://img.logo.dev/${organization.website.replace('https://', '')}?token=${process.env.LOGO_DEV}&retina=true&format=png`)
                }
                alt={`${organization.name} logo`}
                width={128}
                height={128}
                className="object-contain rounded-md"
              />
            ) : (
              <div className="bg-muted-foreground flex h-10 w-10 items-center justify-center rounded-md font-bold text-white">
                {organization.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">{title}</h1>
            <ComplianceSummary text={`Compliance and Security Portal for ${organization.name}.`} />
          </div>
        </div>

        <div className="grid gap-2 sm:flex w-full md:justify-end md:w-auto">
          <Link
            className={buttonVariants({
              variant: 'outline',
              className: 'text-xs',
            })}
            href={`${organization.website || 'https://trycomp.ai'}`}
          >
            Visit {organization.name} <ExternalLink className="h-3 w-3" />
          </Link>
          <Link
            className={buttonVariants({
              variant: 'outline',
              className: 'text-xs',
            })}
            href="https://trycomp.ai"
          >
            <span className="inline-flex items-center">
              <span className="w-6 h-6 flex items-center justify-center">
                <DotLottieReact
                  src="https://lottie.host/e65f14d8-96e8-4ce2-9ad8-5468693a540c/1V8SWnGsv8.lottie"
                  loop
                  autoplay
                  style={{ width: '100%', height: '100%' }}
                />
              </span>
              <span className="ml-2">Monitored by Comp AI</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
