export default function AppLogo() {
    return (
        <>
            <img src="/logoDark.png" alt="UrbanWatch" className="h-8 w-auto block dark:hidden" />
            <img src="/logoLight.png" alt="UrbanWatch" className="h-8 w-auto hidden dark:block" />

            <div className="ml-1 grid flex-1 text-left text-lg">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    UrbanWatch
                </span>
            </div>
        </>
    );
}
