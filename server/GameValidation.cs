using System.Text.RegularExpressions;

namespace PixelPort.Api;

public static partial class GameValidation
{
    // slug — латиница, цифры и дефисы между словами: neon-circuit-2
    [GeneratedRegex("^[a-z0-9]+(-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    // Проверки, которые не требуют базы. Ключи — имена полей из JSON:
    // по ним фронтенд найдёт, у какого поля показать ошибку
    public static Dictionary<string, string[]> Validate(NewGame input)
    {
        var errors = new Dictionary<string, string[]>();

        string title = input.Title?.Trim() ?? "";
        if (title.Length is < 2 or > 80)
        {
            errors["title"] = ["Название — от 2 до 80 символов"];
        }

        string slug = input.Slug?.Trim() ?? "";
        if (!SlugPattern().IsMatch(slug))
        {
            errors["slug"] = ["Только маленькие латинские буквы, цифры и дефисы: neon-circuit-2"];
        }

        if (string.IsNullOrWhiteSpace(input.Genre))
        {
            errors["genre"] = ["Выбери жанр"];
        }

        if (string.IsNullOrWhiteSpace(input.Developer))
        {
            errors["developer"] = ["Укажи разработчика"];
        }

        if (input.ReleaseYear is < 1970 or > 2100)
        {
            errors["releaseYear"] = ["Год — от 1970 до 2100"];
        }

        if (input.Price is < 0 or > 100_000)
        {
            errors["price"] = ["Цена — от 0 до 100 000 ₽"];
        }

        if (input.DiscountPercent is < 0 or > 90)
        {
            errors["discountPercent"] = ["Скидка — от 0 до 90%"];
        }

        string description = input.Description?.Trim() ?? "";
        if (description.Length is < 10 or > 1000)
        {
            errors["description"] = ["Описание — от 10 до 1000 символов"];
        }

        return errors;
    }
}
