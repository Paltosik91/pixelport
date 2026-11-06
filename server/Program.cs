using PixelPort.Api;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "..",
});
var app = builder.Build();

string catalogPath = Path.Combine(app.Environment.WebRootPath, "data", "catalog.json");
List<Game> games = GameCatalog.Load(catalogPath);
app.Logger.LogInformation("Каталог загружен: {Count} игр из {Path}", games.Count, catalogPath);

// Сервер раздаёт папку сайта, но не собственные файлы
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/server"))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/games", () => games);

app.Run();
