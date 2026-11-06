using System.Text.Json;

namespace PixelPort.Api;

public static class GameCatalog
{
    public static List<Game> Load(string path)
    {
        string json = File.ReadAllText(path);
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        return JsonSerializer.Deserialize<List<Game>>(json, options)
            ?? throw new InvalidDataException($"Файл {path} пуст");
    }
}
