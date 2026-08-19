FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY MajstorHub.Api.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Config files never change at runtime in a container - the appsettings.json
# FileSystemWatcher this would otherwise set up can crash startup on hosts
# with a low/exhausted inotify instance limit (seen on Render's free tier).
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet MajstorHub.Api.dll"]
