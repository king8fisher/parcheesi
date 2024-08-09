package main

import (
	"ephemeron.imagineusthere.com/imagine/websitelib/markdownlib"
	"fmt"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/google/uuid"

	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"html/template"

	"ephemeron.imagineusthere.com/imagine/websitelib"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/zzwx/ifchanged"
)

const minify = false

var icons []string
var iconsCached = false
var iconsDirName = "./build/images/icons/"

func main() {
	buildJS([]string{"./src/main/main.ts"}, "./build/bundle.js", api.FormatDefault)
	buildJS([]string{"./src/sw/main.ts"}, "./build/sw.js", api.FormatESModule)
	e := echo.New() // New Echo instance
	// Middleware
	//e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	e.HTTPErrorHandler = func(err error, ctx echo.Context) {
		data := map[string]interface{}{
			"active": "404",
		}
		websitelib.MergeWithAnotherDataMap(data, getCommonMap())
		renderErr := ctx.Render(http.StatusNotFound, "index.html", data)
		if renderErr != nil {
			log.Printf("Error while rendering /%v: %s\n", data["active"], err)
		}
	}

	e.Static("/", "./build")

	glob, err := template.New("main").Funcs(markdownlib.GetTemplateFunctions()).ParseGlob("./build/*.html")
	if err != nil {
		log.Fatalf("Error while parsing templates: %v", err)
	}
	e.Renderer = &websitelib.RendererTemplate{
		Templates: glob,
	}

	e.GET("/sw.js", func(ctx echo.Context) error {
		ctx.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJavaScript)
		return ctx.File("./build/sw.js")
	})
	e.GET("/test.js", func(ctx echo.Context) error {
		ctx.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJavaScript)
		return ctx.File("./build/test.js")
	})

	handler := func(ctx echo.Context) error {
		data := map[string]interface{}{
			"active": "index",
		}
		websitelib.MergeWithAnotherDataMap(data, getCommonMap())
		uuid, err := uuid.NewRandom()
		if err == nil {
			cookie := new(http.Cookie)
			cookie.Name = "parcheesi"
			cookie.Expires = time.Now().Add(365 * 24 * time.Hour)
			cookie.Value = uuid.String()
			ctx.SetCookie(cookie)
		}
		return ctx.Render(http.StatusOK, "index.html", data)
	}

	websitelib.AttachSeveralToCanonical(e, "/", []string{
		"/",
		"/index.php",
		"/index.php/*",
		"/home.php",
		"/home.php/*",
		"/index.htm",
		"/index.htm/*",
		"/index.html",
		"/index.html/*",
		"/default.htm",
		"/default.htm/*",
		"/default.html",
		"/default.html/*",
	}, e.GET, handler)

	adaptableAddr := "localhost:8081" // "localhost:8081" - strictly local network address by default
	// Make it shared on windows machines automatically for testing purposes
	if runtime.GOOS == "windows" {
		adaptableAddr = ":8081"
	}
	if adaptableAddr == ":8081" {
		fmt.Printf("■ %q is a shared network address. Runtime OS: %q", adaptableAddr, runtime.GOOS)
	}
	s := &http.Server{
		Addr:         adaptableAddr,
		ReadTimeout:  60 * time.Second,
		WriteTimeout: 60 * time.Minute,
	}
	e.HideBanner = true
	//if runtime.GOOS == "windows" {
	//  e.Logger.Fatal(e.StartTLS(adaptableAddr, "localhost+2.pem", "localhost+2-key.pem"))
	//} else {
	e.Logger.Debug(e.StartServer(s))
	//}

}

func doneOrError(err error, tName string) {
	if err != nil {
		fmt.Printf("%-20s [❗] Error:\n%s\n", tName, err)
	} else {
		fmt.Printf("%-20s [✔] Done!\n", tName)
	}
}

func getCommonMap() map[string]interface{} {
	return map[string]interface{}{
		"bundleVersion": getBundleVersion(),
		"swVersion":     getServiceWorkerVersion(),
		"icons":         getCachedIcons(),
	}
}

func getCachedIcons() []string {
	if !iconsCached {
		dir, err := ioutil.ReadDir(iconsDirName)
		if err == nil {
			for _, d := range dir {
				if d.Name()[0] >= '0' && d.Name()[0] <= '9' {
					icons = append(icons, strings.TrimSuffix(d.Name(), filepath.Ext(d.Name())))
				}
			}
		}
	}
	return icons
}

func getBundleVersion() string {
	v := ""
	f, err := os.Stat("./build/bundle.js")
	if err == nil {
		v = fmt.Sprintf("%d", f.ModTime().Unix())
	}
	return v
}
func getServiceWorkerVersion() string {
	v := ""
	f, err := os.Stat("./build/sw.js")
	if err == nil {
		v = fmt.Sprintf("%d", f.ModTime().Unix())
	}
	return v
}

func generateWebM() {
	dirName := "./build/sounds/"
	dir, err2 := ioutil.ReadDir(dirName)
	if err2 == nil {
		for _, d := range dir {
			if !d.IsDir() && filepath.Ext(d.Name()) == ".mp3" {
				abs, err := filepath.Abs(dirName + d.Name())
				if err == nil {
					err := ifchanged.ExecuteCommand("C:\\Users\\User\\Downloads\\Pazera_Free_Audio_Extractor_64bit_PORTABLE_2.10\\tools\\FFmpeg64\\ffmpeg.exe",
						"-i", abs, "-dash", "1", dirName+strings.TrimSuffix(d.Name(), filepath.Ext(d.Name()))+".webm")
					if err != nil {
						fmt.Printf("error: %v\n", err)

					}
				}
			}
		}
	} else {
		fmt.Printf("%v\n", err2)
	}
}

func buildJS(entryPoints []string, outputFile string, format api.Format) {
	now := time.Now()
	fmt.Printf("■ Building \"%s\"...\n", outputFile)

	result := api.Build(api.BuildOptions{
		EntryPoints:       entryPoints,
		Outfile:           outputFile,
		Bundle:            true,
		Platform:          api.PlatformBrowser,
		MinifyWhitespace:  minify,
		MinifySyntax:      minify,
		MinifyIdentifiers: minify,
		Format:            format,
		Target:            api.ES2020,
		Sourcemap:         api.SourceMapInline,
	})

	for _, out := range result.OutputFiles {
		ioutil.WriteFile(out.Path, out.Contents, 0644)
	}
	timeElapsed := time.Now().UnixNano() - now.UnixNano()
	fmt.Printf("Time: %5.2f second(s)\n", float64(timeElapsed)*1e-9)
	printAll("Warnings", result.Warnings)
	printAll("Errors", result.Errors)
}

func printAll(prefix string, messages []api.Message) {
	if len(messages) > 0 {
		fmt.Printf("\n■ %s (%d):\n", prefix, len(messages))
		for _, w := range messages {
			fmt.Printf("* %v\n  %v\n", w.Text, locationToString(w.Location))
		}
	}
}

func locationToString(location *api.Location) string {
	if location == nil {
		return ""
	}
	return fmt.Sprintf("%v:%d:%d\n  %v\n  %s", location.File, location.Line, location.Column, location.LineText, strings.Repeat(" ", location.Column)+strings.Repeat("~", location.Length))
}
