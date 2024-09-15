import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RESUME_DATA } from "@/data/resume-data";

export default function Students() {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-md flex flex-col justify-between font-mono text-muted-foreground md:flex-row">
        <p>Total Students: {RESUME_DATA.students.length}</p>
        <p>
          World Champions:{" "}
          {RESUME_DATA.students
            .map((student) =>
              (student.achievements.join("").match(/Overall/g) || []).length > 0
                ? 1
                : 0,
            )
            .reduce((partialSum, a) => partialSum + a, 0 as number)}
        </p>
        <p>
          Overall Wins:{" "}
          {RESUME_DATA.students
            .map(
              (student) =>
                (student.achievements.join("").match(/Overall/g) || []).length,
            )
            .reduce((partialSum, a) => partialSum + a, 0)}
        </p>
      </div>
      {RESUME_DATA.students.map((student) => {
        return (
          <Card
            className="flex flex-col overflow-hidden border border-muted p-3"
            key={student.name}
          >
            <CardContent className="mt-auto flex">
              <div className="flex w-full flex-row gap-5 ">
                <Avatar className="size-32">
                  <AvatarImage alt={student.name} src={student.image} />
                  <AvatarFallback>{student.name}</AvatarFallback>
                </Avatar>
                <div className="mt-2 w-full">
                  <div className="mb-3 flex w-full flex-col items-start justify-between md:flex-row">
                    <p
                      style={{ fontSize: "30px", lineHeight: "32px" }}
                      className="text-card-foreground"
                    >
                      {student.name}
                    </p>
                    <p className="text-md">
                      {student.start} - {student.end}
                    </p>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    {student.divisions.map((division) => {
                      return (
                        <Badge style={{ width: "fit-content" }} key={division}>
                          {division}
                        </Badge>
                      );
                    })}
                  </div>
                  <ul>
                    {student.achievements.map((achievement) => {
                      return <li key={achievement}>{achievement}</li>;
                    })}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
