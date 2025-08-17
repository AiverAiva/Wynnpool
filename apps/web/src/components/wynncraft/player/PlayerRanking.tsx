import { Card, CardContent } from "@/components/ui/card";
import { PlayerBase } from "@/types/playerType";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const categories = {
    Content: ["playerContent", "globalPlayerContent", "warsCompletion"],
    Level: ["combatGlobalLevel", "totalSoloLevel", "combatSoloLevel", "professionsGlobalLevel", "totalGlobalLevel"],
    Profession: ["tailoringLevel", "farmingLevel", "woodworkingLevel", "scribingLevel", "armouringLevel", "jewelingLevel", "fishingLevel", "miningLevel", "cookingLevel", "weaponsmithingLevel", "alchemismLevel", "woodcuttingLevel"],
    Gamemode: ["ironmanContent", "ultimateIronmanContent", "hardcoreLegacyLevel", "hardcoreContent", "craftsmanContent", "huntedContent", "hicContent", "hichContent", "huichContent", "huicContent"],
    Raids: ["grootslangCompletion", "grootslangSrPlayers", "colossusSrPlayers", "colossusCompletion", "orphionSrPlayers", "orphionCompletion", "namelessSrPlayers", "namelessCompletion"]
};

const leaderboardNames: { [key: string]: string } = {
    playerContent: "Total Completion",
    globalPlayerContent: "Global Total Completion",
    warsCompletion: "Wars (Completions)",

    combatSoloLevel: "Combat (Solo Class)",
    combatGlobalLevel: "Combat (All Classes)",
    totalSoloLevel: "Total (Solo Class)",
    totalGlobalLevel: "Total (All Classes)",
    professionsSoloLevel: "Professions (Solo Class)",
    professionsGlobalLevel: "Professions (All Classes)",

    tailoringLevel: "Tailoring",
    farmingLevel: "Farming",
    woodworkingLevel: "Woodworking",
    scribingLevel: "Scribing",
    armouringLevel: "Armouring",
    jewelingLevel: "Jeweling",
    fishingLevel: "Fishing",
    miningLevel: "Mining",
    cookingLevel: "Cooking",
    weaponsmithingLevel: "Weaponsmithing",
    alchemismLevel: "Alchemism",
    woodcuttingLevel: "Woodcutting",

    ironmanContent: "Ironman",
    ultimateIronmanContent: "Ultimate Ironman",
    hardcoreLegacyLevel: "Hardcore Legacy",
    hardcoreContent: "Hardcore",
    craftsmanContent: "Craftsman",
    huntedContent: "Hunted",
    hicContent: "HIC",
    hichContent: "HICH",
    huichContent: "HUICH",
    huicContent: "HUIC",

    grootslangCompletion: "NOTG Completions",
    grootslangSrPlayers: "NOTG Rating",
    colossusCompletion: "TCC Completions",
    colossusSrPlayers: "TCC Rating",
    orphionCompletion: "NOL Completions",
    orphionSrPlayers: "NOL Rating",
    namelessCompletion: "TNA Completions",
    namelessSrPlayers: "TNA Rating",
};


function RankingItem({ name, current, previous }: { name: string; current: number; previous: number }) {
    const diff = previous - current;
    const displayName = leaderboardNames[name] || name;

    return (
        <div className="flex justify-between items-center py-1 text-sm">
            <span className="font-medium">{displayName}</span>
            <div className="flex items-center">
                <span className="font-bold">{current.toLocaleString()}</span>
                {diff !== 0 && (
                    <Badge variant="default" className={`ml-2 text-xs px-1 ${diff > 0 ? "bg-green-500/70" : "bg-red-500/70"}`}>
                        {diff > 0 ? `+${diff}` : diff}
                    </Badge>
                )}
            </div>
        </div>
    );
}

function CategoryCard({ category, items, data }: { category: string; items: string[]; data: PlayerBase }) {
    const filteredItems = items.filter(item => data.ranking[item] !== undefined);
    if (filteredItems.length === 0) return null;

    return (
        <Card className="p-4">
            <h3 className="font-semibold text-base mb-2">{category}</h3>
            <div className="space-y-1">
                {filteredItems
                    .sort((a, b) => data.ranking[a] - data.ranking[b])
                    .map(item => (
                        <RankingItem
                            key={item}
                            name={item}
                            current={data.ranking[item]}
                            previous={data.previousRanking[item] || data.ranking[item]}
                        />
                    ))}
            </div>
        </Card>
    );
}

const PlayerRanking: React.FC<{ data: PlayerBase }> = ({ data }) => {
    const [openItem, setOpenItem] = useState<string | undefined>(undefined);

    return (
        <Card className="mt-4">
            <CardContent>
                <Accordion
                    type="single"
                    collapsible
                    value={openItem}
                    onValueChange={(value) => setOpenItem(value)}
                >
                    <AccordionItem value="rankings" className="border-b-0 -mb-6">
                        <AccordionTrigger className="hover:no-underline hover:text-foreground/60 transition-colors duration-200">
                            Rankings
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(categories).map(([category, items]) => (
                                    <CategoryCard key={category} category={category} items={items} data={data} />
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

export { PlayerRanking };