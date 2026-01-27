import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <>
            <img src="/logoDark.png" alt="UrbanWatch Logo" className="block dark:hidden" />
            <img src="/logoLight.png" alt="UrbanWatch Logo" className="hidden dark:block" />
        </>
    );
}
