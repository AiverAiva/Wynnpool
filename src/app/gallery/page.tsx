import ImageGrid from "@/components/custom/image-grid"

export default function GalleryHome() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="mt-[80px]" />
            <main className="container mx-auto px-4 py-8 max-w-screen-lg">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-6">Gallery</h1>
                    <p className="text-gray-300 mb-8">
                        This page shows the all assets of photography related used on Wynnpool, click on any image to view detailed information. 
                    </p>
                    <ImageGrid />
                </div>
            </main>
        </div>
    )
}
