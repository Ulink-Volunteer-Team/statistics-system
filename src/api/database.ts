import { APIHandlerConstructor } from "./base";
import { z } from "zod";
import path from "path";

/**
 * Exports the database to an Excel file.
 * @param path The path to the file to export to.
 */
export const backupToExcel = APIHandlerConstructor(
	"backup-to-excel",
	z.object({
		filePath: z.string(),
	}),
	(async ({ filePath }, dataSource) => {
		await dataSource.database.exportToExcel(path.resolve(filePath), (table, column, value) => {
			if(table === "recruitment" && column === "eventTime") {
				if(typeof value === "number") return new Date(value);
				else console.warn(`Exporting formatter: Invalid type for eventTime: ${value}`);
			}
			return value;
		})
	})
);

export const importFromExcel = APIHandlerConstructor(
	"import-from-excel",
	z.object({
		filePath: z.string(),
	}),
	(async ({ filePath }, dataSource) => {
		await dataSource.database.importFromExcel(path.resolve(filePath), ((table, col, value) => {
			if (table === "recruitment" && col == "eventTime" && typeof (value) === "number") return Math.floor((value - 25569) * 86400000);
			if (table === "event" && col === "id") return String(value);
			return value;
		}));
	})
)

export default [
	backupToExcel
]
