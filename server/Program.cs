using Microsoft.EntityFrameworkCore;
using PixelPort.Api;
using PixelPort.Api.Data;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "..",
});
builder.Services.AddProblemDetails();

string connectionString = builder.Configuration.GetConnectionString("PixelPort")
    ?? throw new InvalidOperationException("Нет строки подключения ConnectionStrings:PixelPort");
builder.Services.AddDbContext<PixelPortDb>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());

var app = builder.Build();

// Начальные данные: в пустую базу переносим игры из catalog.json
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PixelPortDb>();

    // База отстаёт от кода — говорим, что делать, вместо «relation "games" does not exist»
    List<string> pending = db.Database.GetPendingMigrations().ToList();
    if (pending.Count > 0)
    {
        app.Logger.LogCritical(
            "База не обновлена: не применены миграции {Pending}. Выполни в папке server: dotnet ef database update",
            string.Join(", ", pending));
        return;
    }

    string catalogPath = Path.Combine(app.Environment.WebRootPath, "data", "catalog.json");
    int added = CatalogSeeder.SeedIfEmpty(db, catalogPath);
    app.Logger.LogInformation("Начальные данные: добавлено игр {Added}, всего в базе {Total}", added, db.Games.Count());

    string reviewsPath = Path.Combine(app.Environment.ContentRootPath, "Data", "reviews.json");
    int reviews = CatalogSeeder.SeedReviewsIfEmpty(db, reviewsPath);
    app.Logger.LogInformation("Начальные данные: добавлено отзывов {Added}", reviews);

    string ordersPath = Path.Combine(app.Environment.ContentRootPath, "Data", "orders.json");
    int orders = CatalogSeeder.SeedOrdersIfEmpty(db, ordersPath);
    app.Logger.LogInformation("Начальные данные: добавлено заказов {Added}", orders);
}

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

app.MapGameEndpoints();
app.MapReviewEndpoints();
app.MapAdminEndpoints();
app.MapOrderEndpoints();
app.MapStatsEndpoints();

app.Run();
