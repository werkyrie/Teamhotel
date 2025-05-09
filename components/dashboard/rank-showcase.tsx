import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RankBadge, getRankName } from "./rank-badges"

export function RankShowcase() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rank System</CardTitle>
          <CardDescription>Performance ranks for top agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((rank) => (
              <div key={rank} className="flex flex-col items-center justify-center p-3 border rounded-lg">
                <RankBadge rank={rank} className="mb-2" />
                <p className="text-sm font-semibold">{getRankName(rank)}</p>
                <p className="text-xs text-muted-foreground">{rank <= 7 ? `Top ${rank}` : `Top ${rank}-10`}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
